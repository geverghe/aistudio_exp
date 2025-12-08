import React, { useState } from 'react';
import { Plus, X, ChevronDown, Tag } from 'lucide-react';
import { AspectType, AspectAssignment } from '../types';

export const AVAILABLE_ASPECT_TYPES: AspectType[] = [
  {
    id: 'aspect_data_quality',
    name: 'Data Quality',
    description: 'Data quality metrics and thresholds',
    fields: [
      { name: 'completeness', type: 'number', required: true },
      { name: 'accuracy', type: 'number' },
      { name: 'freshness', type: 'string' }
    ]
  },
  {
    id: 'aspect_pii',
    name: 'PII Classification',
    description: 'Personally Identifiable Information classification',
    fields: [
      { name: 'pii_type', type: 'string', required: true },
      { name: 'sensitivity_level', type: 'string', required: true },
      { name: 'requires_masking', type: 'boolean' }
    ]
  },
  {
    id: 'aspect_governance',
    name: 'Data Governance',
    description: 'Governance and stewardship information',
    fields: [
      { name: 'data_owner', type: 'string', required: true },
      { name: 'data_steward', type: 'string' },
      { name: 'retention_period', type: 'string' },
      { name: 'classification', type: 'string' }
    ]
  },
  {
    id: 'aspect_lineage',
    name: 'Data Lineage',
    description: 'Source and transformation information',
    fields: [
      { name: 'source_system', type: 'string', required: true },
      { name: 'transformation_logic', type: 'string' },
      { name: 'update_frequency', type: 'string' }
    ]
  },
  {
    id: 'aspect_business_context',
    name: 'Business Context',
    description: 'Business meaning and usage context',
    fields: [
      { name: 'business_definition', type: 'string', required: true },
      { name: 'business_rules', type: 'string' },
      { name: 'example_values', type: 'string' }
    ]
  }
];

interface AspectSelectorProps {
  aspects: AspectAssignment[];
  onChange: (aspects: AspectAssignment[]) => void;
  label?: string;
}

export const AspectSelector: React.FC<AspectSelectorProps> = ({
  aspects,
  onChange,
  label = 'Aspects'
}) => {
  const [isAddingAspect, setIsAddingAspect] = useState(false);
  const [selectedAspectType, setSelectedAspectType] = useState<string | null>(null);
  const [aspectValues, setAspectValues] = useState<Record<string, any>>({});
  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);

  const availableToAdd = AVAILABLE_ASPECT_TYPES.filter(
    at => !aspects.find(a => a.aspectTypeId === at.id)
  );

  const handleAddAspect = () => {
    if (!selectedAspectType) return;
    
    const newAspect: AspectAssignment = {
      aspectTypeId: selectedAspectType,
      values: aspectValues
    };
    
    onChange([...aspects, newAspect]);
    setIsAddingAspect(false);
    setSelectedAspectType(null);
    setAspectValues({});
  };

  const handleRemoveAspect = (aspectTypeId: string) => {
    onChange(aspects.filter(a => a.aspectTypeId !== aspectTypeId));
  };

  const handleUpdateAspectValue = (aspectTypeId: string, field: string, value: any) => {
    onChange(
      aspects.map(a => 
        a.aspectTypeId === aspectTypeId 
          ? { ...a, values: { ...a.values, [field]: value } }
          : a
      )
    );
  };

  const getAspectType = (id: string) => AVAILABLE_ASPECT_TYPES.find(at => at.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        {availableToAdd.length > 0 && (
          <button
            onClick={() => setIsAddingAspect(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Plus size={12} />
            Add Aspect
          </button>
        )}
      </div>

      {aspects.length === 0 && !isAddingAspect ? (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
          <Tag size={20} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No aspects assigned</p>
          <button
            onClick={() => setIsAddingAspect(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Add your first aspect
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {aspects.map(aspect => {
            const aspectType = getAspectType(aspect.aspectTypeId);
            if (!aspectType) return null;
            
            const isExpanded = expandedAspect === aspect.aspectTypeId;
            
            return (
              <div 
                key={aspect.aspectTypeId} 
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                <div 
                  className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedAspect(isExpanded ? null : aspect.aspectTypeId)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown 
                      size={14} 
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                    <span className="text-sm font-medium text-gray-800">{aspectType.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAspect(aspect.aspectTypeId);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="px-3 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
                    {aspectType.fields.map(field => (
                      <div key={field.name}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">
                          {field.name.replace(/_/g, ' ')}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={aspect.values[field.name] || false}
                            onChange={(e) => handleUpdateAspectValue(aspect.aspectTypeId, field.name, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={aspect.values[field.name] || ''}
                            onChange={(e) => handleUpdateAspectValue(aspect.aspectTypeId, field.name, parseFloat(e.target.value))}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                            placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={aspect.values[field.name] || ''}
                            onChange={(e) => handleUpdateAspectValue(aspect.aspectTypeId, field.name, e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                            placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAddingAspect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddingAspect(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Aspect</h3>
              <button onClick={() => setIsAddingAspect(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Aspect Type</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableToAdd.map(at => (
                    <div
                      key={at.id}
                      onClick={() => {
                        setSelectedAspectType(at.id);
                        setAspectValues({});
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAspectType === at.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-800">{at.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{at.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAspectType && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Configure Aspect</label>
                  <div className="space-y-3">
                    {getAspectType(selectedAspectType)?.fields.map(field => (
                      <div key={field.name}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">
                          {field.name.replace(/_/g, ' ')}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={aspectValues[field.name] || ''}
                          onChange={(e) => setAspectValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsAddingAspect(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAspect}
                disabled={!selectedAspectType}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Aspect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AspectSelector;
