# JobDisco - Job Discovery Automation Roadmap

## 🎯 Project Vision
Build an automated job discovery platform that replaces manual job searching with intelligent monitoring of company career pages, LinkedIn jobs, and AI-powered company discovery - saving 85%+ of time spent on job hunting activities.

## 📍 Current Status
- **Date**: January 27, 2025
- **Version**: MVP v0.1
- **Focus**: Phase 1: Career Page Monitoring → Phase 2: LinkedIn Integration → Phase 3: Automated Discovery → Phase 4: AI Research
- **Principle**: Start simple, deliver value each week, expand incrementally

---

## 🚀 Phase 1: Basic Career Page Monitoring (Week 1)
**Goal**: Stop manually checking career pages by automating daily monitoring of 10-15 companies

### Week 1: Core Infrastructure & Web Scraping
- [ ] Set up project structure (backend/frontend/n8n)
- [ ] Configure backend with FastAPI + PostgreSQL
- [ ] Create database models:
  - [ ] Company (id, name, career_url, last_checked, active)
  - [ ] Job (id, company_id, title, url, location, posted_date, description)
  - [ ] ScrapeLog (id, company_id, status, error_message, timestamp)
- [ ] Build web scraping service:
  - [ ] Generic career page parser using BeautifulSoup4
  - [ ] Australia/Remote keyword detection
  - [ ] Error handling and retry logic
  - [ ] Rate limiting to avoid blocking
- [ ] Create REST API endpoints:
  - [ ] POST /api/companies - Add new company
  - [ ] GET /api/companies - List all companies
  - [ ] GET /api/jobs - Get filtered job listings
  - [ ] POST /api/scrape/trigger - Manual scrape trigger
- [ ] Set up Next.js frontend:
  - [ ] Company management page (add/edit/disable)
  - [ ] Job listings dashboard with filters
  - [ ] Basic data tables with sorting
- [ ] Configure N8N workflow:
  - [ ] Daily schedule trigger (9 AM)
  - [ ] Loop through active companies
  - [ ] Call backend scraping endpoint
  - [ ] Export results to Google Sheets

**Success**: Manual career page checking eliminated

---

## 🚀 Phase 2: LinkedIn Integration (Week 2)
**Goal**: Stop manually browsing LinkedIn jobs by adding automated LinkedIn monitoring

### Week 2: LinkedIn Scraping & Duplicate Detection
- [ ] Extend Company model with LinkedIn fields:
  - [ ] linkedin_company_id
  - [ ] linkedin_url
  - [ ] linkedin_enabled
- [ ] Implement LinkedIn job scraping:
  - [ ] Use public LinkedIn job search API
  - [ ] Parse job listings and metadata
  - [ ] Handle LinkedIn rate limits
  - [ ] Match jobs to existing companies
- [ ] Build duplicate detection system:
  - [ ] Job similarity scoring algorithm
  - [ ] Title/company/location matching
  - [ ] Manual override capability
- [ ] Add LinkedIn API endpoints:
  - [ ] POST /api/companies/{id}/linkedin - Add LinkedIn URL
  - [ ] GET /api/jobs/duplicates - View potential duplicates
  - [ ] POST /api/jobs/merge - Merge duplicate jobs
- [ ] Update frontend:
  - [ ] Add LinkedIn URL field to company form
  - [ ] Create duplicate management interface
  - [ ] Add job source indicators (Career/LinkedIn)
  - [ ] Bulk merge functionality
- [ ] Extend N8N workflow:
  - [ ] Add LinkedIn checking after career pages
  - [ ] Implement duplicate detection logic
  - [ ] Create alerts for LinkedIn-only jobs

**Success**: LinkedIn job browsing eliminated

---

## 🚀 Phase 3: Automated Company Discovery (Week 3)
**Goal**: Stop manual Google searches by automating discovery of expanding companies

### Week 3: RSS Monitoring & Discovery Queue
- [ ] Create discovery data models:
  - [ ] RSSFeed (id, url, name, category, active)
  - [ ] DiscoveryQueue (id, company_name, source, confidence, status)
  - [ ] DiscoveryKeyword (id, keyword, category, weight)
- [ ] Build RSS monitoring service:
  - [ ] Parse tech news RSS feeds (TechCrunch, HackerNews, etc.)
  - [ ] Extract company mentions from articles
  - [ ] Keyword filtering (expansion, hiring, Australia, remote)
  - [ ] Confidence scoring based on context
- [ ] Create discovery API endpoints:
  - [ ] POST /api/feeds - Add new RSS feed
  - [ ] GET /api/discovery/queue - View discovery queue
  - [ ] POST /api/discovery/approve - Approve company for monitoring
  - [ ] POST /api/discovery/reject - Reject with reason
- [ ] Build discovery frontend:
  - [ ] Discovery dashboard with queue
  - [ ] Company research preview
  - [ ] Bulk approval actions
  - [ ] RSS feed management
- [ ] Create N8N discovery workflow:
  - [ ] Hourly RSS feed checks
  - [ ] Keyword matching and scoring
  - [ ] Auto-populate discovery queue
  - [ ] Weekly discovery summary email

**Success**: Manual company searches eliminated

---

## 🚀 Phase 4: AI-Powered Research (Week 4)
**Goal**: Replace monthly Perplexity sessions with automated AI research

### Week 4: AI Integration & Automated Research
- [ ] Integrate AI research APIs:
  - [ ] Perplexity API setup and configuration
  - [ ] Rate limiting and cost management
  - [ ] Response parsing and validation
- [ ] Build research service:
  - [ ] Generate targeted research queries
  - [ ] Parse AI responses for company data
  - [ ] Extract structured information:
    - [ ] Company size and growth
    - [ ] Recent funding/expansion
    - [ ] Tech stack and culture
    - [ ] Hiring intentions
- [ ] Create research endpoints:
  - [ ] POST /api/research/companies - Trigger research
  - [ ] GET /api/research/history - View past research
  - [ ] POST /api/research/schedule - Set research schedule
- [ ] Add research UI:
  - [ ] Research dashboard
  - [ ] Research history with insights
  - [ ] Manual research trigger
  - [ ] Company profile auto-generation
- [ ] Implement research workflow:
  - [ ] Weekly AI research runs
  - [ ] Structured data extraction
  - [ ] Auto-add promising companies
  - [ ] Quality validation checks

**Success**: Manual research sessions eliminated

---

## 🎯 Success Metrics

### Overall MVP Success Criteria
- [ ] **Time Savings**: 85%+ reduction in manual job searching time
- [ ] **Coverage**: Monitor 30+ companies consistently (vs 10-15 manually)
- [ ] **Discovery Rate**: Find 5+ new relevant companies per week
- [ ] **Job Relevance**: 80%+ of discovered jobs match criteria
- [ ] **System Reliability**: 95%+ uptime for daily monitoring

### Week 1 Metrics (Career Page Monitoring)
- [ ] Successfully scrape 10+ company career pages
- [ ] Detect Australia/Remote jobs with 90%+ accuracy
- [ ] Daily automated runs without manual intervention
- [ ] Results exported to Google Sheets automatically

### Week 2 Metrics (LinkedIn Integration)
- [ ] Monitor LinkedIn jobs for all tracked companies
- [ ] Detect 95%+ of duplicate job postings
- [ ] Reduce false positives to <10%
- [ ] Combined dashboard showing all job sources

### Week 3 Metrics (Automated Discovery)
- [ ] Monitor 5+ tech news RSS feeds
- [ ] Identify 10+ expanding companies per week
- [ ] 70%+ confidence in discovery recommendations
- [ ] Weekly review time <15 minutes

### Week 4 Metrics (AI Research)
- [ ] Automated research on 20+ companies
- [ ] Extract 5+ data points per company
- [ ] 80%+ accuracy in extracted information
- [ ] Monthly Perplexity sessions eliminated

---

## 🛠️ Technical Implementation

### Technology Stack
```
Backend:
- FastAPI (REST API)
- PostgreSQL (primary database)
- SQLAlchemy (ORM)
- BeautifulSoup4/Playwright (web scraping)
- APScheduler (job scheduling)
- Pydantic (data validation)

Frontend:
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Shadcn/ui (component library)
- TanStack Query (data fetching)
- Zod (schema validation)

Automation:
- N8N (workflow automation)
- Docker Compose (orchestration)
- Caddy (reverse proxy)
- GitHub Actions (CI/CD)
```

### API Design
```
/api/companies
  GET    - List all companies
  POST   - Add new company
  PUT    - Update company details
  DELETE - Remove company

/api/jobs
  GET    - List jobs (with filters)
  POST   - Manual job addition
  DELETE - Remove job

/api/scrape
  POST   /trigger - Manual scrape
  GET    /status - Check scrape status
  GET    /logs - View scrape history

/api/discovery
  GET    /queue - View discovery queue
  POST   /approve - Approve company
  POST   /reject - Reject company

/api/research
  POST   /companies - Trigger research
  GET    /history - View research history
```

---

## 🔄 Development Process

### Daily Workflow
1. **Morning**: Check roadmap, pick tasks
2. **Development**: Implement features with TDD
3. **Testing**: Run tests, fix issues
4. **Documentation**: Update as you code
5. **Commit**: Clear commit messages

### Weekly Milestones
- **Monday**: Plan week, update todos
- **Wednesday**: Mid-week checkpoint
- **Friday**: Demo, retrospective
- **Continuous**: Update ROADMAP.md checkboxes

### Quality Standards
- [ ] 80%+ test coverage for backend
- [ ] All API endpoints documented
- [ ] Frontend components have stories
- [ ] Performance: <2s page loads
- [ ] Security: Input validation on all endpoints

---

## 📊 Risk Management

### Technical Risks
1. **Web Scraping Blocks**
   - Mitigation: Rate limiting, rotating user agents
   - Fallback: Manual entry option

2. **LinkedIn API Limits**
   - Mitigation: Caching, batch processing
   - Fallback: Reduced check frequency

3. **AI API Costs**
   - Mitigation: Usage caps, caching
   - Fallback: Manual research mode

### Business Risks
1. **Scope Creep**
   - Mitigation: Strict weekly goals
   - Focus: Core MVP features only

2. **Over-Engineering**
   - Mitigation: Start simple, iterate
   - Principle: Working code > perfect code

---

## 🚀 Post-MVP Roadmap

### Phase 5: Enhanced Features (Weeks 5-6)
- Email notifications for new jobs
- Advanced filtering and search
- Job application tracking
- Chrome extension for quick adds

### Phase 6: Scale & Optimize (Weeks 7-8)
- Performance optimization
- Multi-user support
- Premium features (more companies, faster checks)
- Mobile app consideration

### Phase 7: Advanced Automation (Weeks 9-12)
- Resume tailoring per job
- Application automation
- Interview scheduling
- Market insights dashboard

---

*This roadmap is a living document. Update checkboxes as tasks are completed. For implementation details, see the codebase and documentation.*