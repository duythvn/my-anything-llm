const { RelevanceScorer } = require('../../../utils/vectorDbProviders/RelevanceScorer');

describe('RelevanceScorer', () => {
    let scorer;
    
    beforeEach(() => {
        scorer = new RelevanceScorer();
    });
    
    describe('scoreResults method', () => {
        const mockResults = [
            { content: 'iPhone 15 Pro features and specifications', score: 0.85 },
            { content: 'Android phone general information', score: 0.75 },
            { content: 'Laptop computer details', score: 0.65 }
        ];
        
        it('should add relevance scores to results', async () => {
            const scored = await scorer.scoreResults(mockResults, {
                query: 'iPhone features',
                weights: { textMatch: 0.5, vectorSimilarity: 0.5 }
            });
            
            expect(scored).toHaveLength(3);
            expect(scored[0]).toHaveProperty('relevanceScore');
            expect(scored[0]).toHaveProperty('scoreBreakdown');
            expect(scored[0]).toHaveProperty('scoreFactors');
        });
        
        it('should prioritize text matches in scoring', async () => {
            const scored = await scorer.scoreResults(mockResults, {
                query: 'iPhone',
                weights: { textMatch: 0.8, vectorSimilarity: 0.2 }
            });
            
            // iPhone result should score higher due to text match
            const iphoneResult = scored.find(r => r.content.includes('iPhone'));
            const androidResult = scored.find(r => r.content.includes('Android'));
            
            expect(iphoneResult.relevanceScore).toBeGreaterThan(androidResult.relevanceScore);
        });
        
        it('should handle empty results', async () => {
            const scored = await scorer.scoreResults([], {
                query: 'test query',
                weights: { textMatch: 0.5, vectorSimilarity: 0.5 }
            });
            
            expect(scored).toEqual([]);
        });
        
        it('should use default weights when not provided', async () => {
            const scored = await scorer.scoreResults(mockResults, {
                query: 'test query'
            });
            
            expect(scored).toHaveLength(3);
            expect(scored[0]).toHaveProperty('relevanceScore');
        });
    });
});