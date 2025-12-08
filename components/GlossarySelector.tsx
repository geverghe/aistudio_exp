import React, { useState, useMemo } from 'react';
import { Plus, X, Search, BookOpen } from 'lucide-react';
import { GlossaryTerm } from '../types';

export const AVAILABLE_GLOSSARY_TERMS: GlossaryTerm[] = [
  { id: 'term_revenue', name: 'Revenue', description: 'Total income generated from sales of goods or services', domain: 'Finance' },
  { id: 'term_customer', name: 'Customer', description: 'An individual or organization that purchases goods or services', domain: 'Sales' },
  { id: 'term_sku', name: 'SKU', description: 'Stock Keeping Unit - unique identifier for a product', domain: 'Inventory' },
  { id: 'term_mrr', name: 'MRR', description: 'Monthly Recurring Revenue - predictable monthly revenue', domain: 'Finance' },
  { id: 'term_churn', name: 'Churn Rate', description: 'Rate at which customers stop doing business', domain: 'Sales' },
  { id: 'term_ltv', name: 'LTV', description: 'Lifetime Value - total revenue from a customer relationship', domain: 'Finance' },
  { id: 'term_cac', name: 'CAC', description: 'Customer Acquisition Cost - cost to acquire a new customer', domain: 'Marketing' },
  { id: 'term_nps', name: 'NPS', description: 'Net Promoter Score - measure of customer loyalty', domain: 'Customer Success' },
  { id: 'term_arpu', name: 'ARPU', description: 'Average Revenue Per User', domain: 'Finance' },
  { id: 'term_gmv', name: 'GMV', description: 'Gross Merchandise Value - total value of merchandise sold', domain: 'E-commerce' },
  { id: 'term_pii', name: 'PII', description: 'Personally Identifiable Information', domain: 'Compliance' },
  { id: 'term_gdpr', name: 'GDPR', description: 'General Data Protection Regulation compliance status', domain: 'Compliance' }
];

interface GlossarySelectorProps {
  selectedTerms: GlossaryTerm[];
  onChange: (terms: GlossaryTerm[]) => void;
  label?: string;
}

export const GlossarySelector: React.FC<GlossarySelectorProps> = ({
  selectedTerms,
  onChange,
  label = 'Glossary Terms'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddTerm = (term: GlossaryTerm) => {
    if (!selectedTerms.find(t => t.id === term.id)) {
      onChange([...selectedTerms, term]);
    }
  };

  const handleRemoveTerm = (termId: string) => {
    onChange(selectedTerms.filter(t => t.id !== termId));
  };

  const filteredTerms = useMemo(() => {
    if (!searchQuery) return AVAILABLE_GLOSSARY_TERMS;
    const query = searchQuery.toLowerCase();
    return AVAILABLE_GLOSSARY_TERMS.filter(
      t => t.name.toLowerCase().includes(query) || 
           t.description.toLowerCase().includes(query) ||
           t.domain?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const domains = useMemo(() => {
    const uniqueDomains = new Set(AVAILABLE_GLOSSARY_TERMS.map(t => t.domain).filter(Boolean));
    return Array.from(uniqueDomains) as string[];
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <Plus size={12} />
          Add Term
        </button>
      </div>

      {selectedTerms.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
          <BookOpen size={20} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No glossary terms associated</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Associate a glossary term
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedTerms.map(term => (
            <div
              key={term.id}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200 hover:border-purple-300"
            >
              <BookOpen size={12} />
              <span className="font-medium">{term.name}</span>
              <button
                onClick={() => handleRemoveTerm(term.id)}
                className="p-0.5 hover:bg-purple-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Add Glossary Terms</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search terms..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh] p-4">
              {domains.map(domain => {
                const domainTerms = filteredTerms.filter(t => t.domain === domain);
                if (domainTerms.length === 0) return null;
                
                return (
                  <div key={domain} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{domain}</h4>
                    <div className="space-y-1">
                      {domainTerms.map(term => {
                        const isSelected = selectedTerms.some(t => t.id === term.id);
                        return (
                          <div
                            key={term.id}
                            onClick={() => !isSelected && handleAddTerm(term)}
                            className={`p-3 rounded-lg border transition-colors ${
                              isSelected 
                                ? 'bg-purple-50 border-purple-200 cursor-default'
                                : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-gray-800">{term.name}</span>
                              {isSelected && (
                                <span className="text-xs text-purple-600 font-medium">Added</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{term.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredTerms.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No terms match your search</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossarySelector;
