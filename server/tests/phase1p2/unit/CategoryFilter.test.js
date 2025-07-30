const { CategoryFilter } = require('../../../utils/vectorDbProviders/CategoryFilter');

describe('CategoryFilter', () => {
    let filter;
    
    beforeEach(() => {
        filter = CategoryFilter; // It's a singleton instance, not a class
    });
    
    describe('Component initialization', () => {
        it('should initialize with filter strategies', () => {
            expect(filter.filterStrategies).toBeDefined();
            expect(filter.filterStrategies.include).toBeDefined();
            expect(filter.filterStrategies.exclude).toBeDefined();
            expect(filter.filterStrategies.hierarchical).toBeDefined();
            expect(filter.filterStrategies.weighted).toBeDefined();
        });
    });
    
    describe('applyFilter method', () => {
        it('should apply filter to search parameters', () => {
            const searchParams = {
                namespace: 'test',
                topN: 10
            };
            
            const filterConfig = {
                strategy: 'include',
                categories: ['Products/Electronics']
            };
            
            const result = filter.applyFilter(searchParams, filterConfig);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
        
        it('should handle empty search parameters', () => {
            const result = filter.applyFilter({}, {
                strategy: 'include',
                categories: ['Products/Electronics']
            });
            
            expect(result).toBeDefined();
        });
        
        it('should handle missing filter config', () => {
            const searchParams = { namespace: 'test' };
            const result = filter.applyFilter(searchParams, {});
            
            expect(result).toBeDefined();
        });
        
        it('should support different filter strategies', () => {
            const searchParams = { namespace: 'test' };
            
            const includeResult = filter.applyFilter(searchParams, {
                strategy: 'include',
                categories: ['Products']
            });
            
            const excludeResult = filter.applyFilter(searchParams, {
                strategy: 'exclude',
                categories: ['Products']
            });
            
            expect(includeResult).toBeDefined();
            expect(excludeResult).toBeDefined();
        });
    });
});