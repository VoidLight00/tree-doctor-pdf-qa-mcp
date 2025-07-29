const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database connection
const db = new sqlite3.Database(path.join(__dirname, '..', 'tree-doctor-pdf-qa.db'), (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// API Routes

// Search diseases and pests
app.get('/api/search', (req, res) => {
    const { q, tree, symptom } = req.query;
    let query = `
        SELECT DISTINCT 
            e.id,
            e.page_number,
            e.chunk_text as description,
            e.metadata
        FROM embeddings e
        WHERE 1=1
    `;
    
    const params = [];
    
    if (q) {
        query += ` AND e.chunk_text LIKE ?`;
        params.push(`%${q}%`);
    }
    
    if (tree) {
        query += ` AND e.chunk_text LIKE ?`;
        params.push(`%${tree}%`);
    }
    
    if (symptom) {
        query += ` AND e.chunk_text LIKE ?`;
        params.push(`%${symptom}%`);
    }
    
    query += ` LIMIT 20`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Search error:', err);
            res.status(500).json({ error: 'Search failed' });
            return;
        }
        
        // Transform results
        const results = rows.map(row => {
            const metadata = JSON.parse(row.metadata || '{}');
            return {
                id: row.id,
                name: extractDiseaseName(row.description),
                description: row.description.substring(0, 200) + '...',
                tags: extractTags(row.description),
                pageNumber: row.page_number,
                source: metadata.source || 'Unknown'
            };
        });
        
        res.json(results);
    });
});

// Search medicines
app.get('/api/medicine', (req, res) => {
    const { q } = req.query;
    
    const query = `
        SELECT DISTINCT 
            e.id,
            e.chunk_text as content,
            e.metadata
        FROM embeddings e
        WHERE e.chunk_text LIKE ? 
        AND (e.chunk_text LIKE '%약제%' OR e.chunk_text LIKE '%농약%' OR e.chunk_text LIKE '%살충제%' OR e.chunk_text LIKE '%살균제%')
        LIMIT 20
    `;
    
    db.all(query, [`%${q}%`], (err, rows) => {
        if (err) {
            console.error('Medicine search error:', err);
            res.status(500).json({ error: 'Medicine search failed' });
            return;
        }
        
        const results = rows.map(row => {
            return {
                id: row.id,
                name: extractMedicineName(row.content),
                ingredient: extractIngredient(row.content),
                usage: extractUsage(row.content),
                dosage: extractDosage(row.content),
                caution: extractCaution(row.content)
            };
        });
        
        res.json(results);
    });
});

// Get disease/pest detail
app.get('/api/detail/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            e.id,
            e.chunk_text as content,
            e.page_number,
            e.metadata,
            p.filename,
            p.total_pages
        FROM embeddings e
        LEFT JOIN pdfs p ON e.pdf_id = p.id
        WHERE e.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Detail fetch error:', err);
            res.status(500).json({ error: 'Failed to fetch details' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        
        res.json({
            id: row.id,
            content: row.content,
            pageNumber: row.page_number,
            source: row.filename,
            totalPages: row.total_pages,
            metadata: JSON.parse(row.metadata || '{}')
        });
    });
});

// Get control schedules
app.get('/api/schedules', (req, res) => {
    const { year, month } = req.query;
    
    // This would be enhanced with actual schedule data
    const mockSchedules = [
        {
            date: `${year}-${month}-15`,
            event: '소나무재선충 예방주사',
            description: '소나무, 곰솔 대상 예방주사 실시',
            priority: 'high'
        },
        {
            date: `${year}-${month}-20`,
            event: '봄철 응애류 방제',
            description: '잎응애, 혹응애 등 방제 적기',
            priority: 'medium'
        }
    ];
    
    res.json(mockSchedules);
});

// Memory MCP integration endpoint
app.post('/api/memory/search', async (req, res) => {
    const { query } = req.body;
    
    try {
        // This would integrate with Memory MCP
        // For now, return mock data
        res.json({
            entities: [],
            relations: []
        });
    } catch (error) {
        console.error('Memory search error:', error);
        res.status(500).json({ error: 'Memory search failed' });
    }
});

// Helper functions
function extractDiseaseName(text) {
    // Extract disease name from text
    const match = text.match(/([가-힣]+병|[가-힣]+충)/);
    return match ? match[0] : '병해충';
}

function extractTags(text) {
    const tags = [];
    
    // Extract tree types
    const trees = text.match(/(소나무|참나무|벚나무|느티나무|은행나무)/g);
    if (trees) tags.push(...new Set(trees));
    
    // Extract symptom types
    if (text.includes('잎')) tags.push('잎병해');
    if (text.includes('가지') || text.includes('줄기')) tags.push('가지병해');
    if (text.includes('뿌리')) tags.push('뿌리병해');
    if (text.includes('충') && !text.includes('충분')) tags.push('해충');
    if (text.includes('병')) tags.push('병해');
    
    return [...new Set(tags)];
}

function extractMedicineName(text) {
    const match = text.match(/([가-힣]+제\s*\d*%?|[가-힣]+\s*유제|[가-힣]+\s*수화제)/);
    return match ? match[0] : '약제명';
}

function extractIngredient(text) {
    const match = text.match(/성분[：:]\s*([^,\n]+)/);
    return match ? match[1] : '성분 정보 없음';
}

function extractUsage(text) {
    const match = text.match(/용도[：:]\s*([^,\n]+)|방제[：:]\s*([^,\n]+)/);
    return match ? (match[1] || match[2]) : '용도 정보 없음';
}

function extractDosage(text) {
    const match = text.match(/(\d+배\s*희석|\d+L\/\d+a|사용량[：:]\s*[^,\n]+)/);
    return match ? match[0] : '사용법 정보 없음';
}

function extractCaution(text) {
    const match = text.match(/주의[：:]\s*([^,\n]+)|독성[：:]\s*([^,\n]+)/);
    return match ? (match[1] || match[2]) : '일반적인 농약 안전 수칙 준수';
}

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tree Doctor Assistant server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the app`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});