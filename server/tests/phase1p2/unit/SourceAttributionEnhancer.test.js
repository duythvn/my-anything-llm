const { SourceAttributionEnhancer } = require('../../../utils/vectorDbProviders/SourceAttributionEnhancer');

describe('SourceAttributionEnhancer', () => {
    let enhancer;
    
    beforeEach(() => {
        enhancer = new SourceAttributionEnhancer();
    });
    
    describe('enhanceMetadata method', () => {
        it('should enhance metadata with source attribution', () => {
            const originalMetadata = {
                filename: 'test.pdf',
                docId: 123
            };
            
            const enhancedData = {
                sourceType: 'product_catalog',
                sourceUrl: 'https://example.com/catalog.pdf'
            };
            
            const result = enhancer.enhanceMetadata(originalMetadata, enhancedData, 0, 'Test content');
            
            expect(result.sourceType).toBe('product_catalog');
            expect(result.sourceUrl).toBe('https://example.com/catalog.pdf');
            expect(result.text).toBe('Test content');
            expect(result.filename).toBe('test.pdf');
            expect(result.docId).toBe(123);
        });
        
        it('should handle empty metadata gracefully', () => {
            const result = enhancer.enhanceMetadata({}, {}, 0, 'Test content');
            
            expect(result.text).toBe('Test content');
            expect(result.sourceType).toBe('manual_upload'); // default
            expect(result.createdAt).toBeDefined(); // Actual field name
        });
        
        it('should preserve original metadata fields', () => {
            const originalMetadata = {
                customField: 'preserved',
                title: 'Original Title'
            };
            
            const result = enhancer.enhanceMetadata(originalMetadata, {}, 0, 'Test');
            
            expect(result.customField).toBe('preserved');
            expect(result.docTitle).toBe('Original Title');
        });
    });
});