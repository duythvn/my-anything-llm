# Sub-Agent Implementation Guide for JobDisco

## 🚀 Quick Start

### 1. Enable Sub-Agents in Claude Code
```bash
# The agent files are already created in .claude/agents/
ls -la .claude/agents/
# Should show: planner.md, coder.md, tester.md
```

### 2. Basic Usage
```bash
# Planning phase
@planner Create technical spec for Week 1 career page monitoring

# Implementation phase  
@coder Implement the Company model with TDD approach

# Review phase
@tester Review the Company model implementation

# Or run complete cycle
/dev-cycle Week 1 career page monitoring system
```

### 3. Verify Setup
```bash
# Test each agent
@planner What's your role?
@coder What's your role?
@tester What's your role?
```

## 📋 Implementation Checklist

### Phase 1: Setup (Day 1)
- [x] Create agent configuration files in `.claude/agents/`
- [x] Create agent-specific commands in `.claude/commands/`
- [x] Document agent workflow and patterns
- [ ] Test agents with simple tasks
- [ ] Refine system prompts based on results

### Phase 2: Week 1 Implementation (Days 2-5)
- [ ] Use planner for technical specifications
- [ ] Use coder for TDD implementation
- [ ] Use tester for quality assurance
- [ ] Document lessons learned
- [ ] Track time savings metrics

### Phase 3: Refinement (Week 2)
- [ ] Adjust agent prompts based on Week 1
- [ ] Create specialized agents if needed
- [ ] Develop agent composition patterns
- [ ] Share best practices with team

## 🎯 Key Benefits Realized

### 1. **Separation of Concerns**
- Planner focuses purely on architecture
- Coder focuses on clean implementation
- Tester focuses on quality assurance

### 2. **Better Context Management**
- Each agent starts fresh without clutter
- Specialized tools per role
- Focused system prompts

### 3. **Enforced Best Practices**
- Mandatory planning phase
- TDD approach enforced
- Automatic code review

### 4. **Improved Velocity**
- Parallel work possible
- Less context switching
- Fewer rewrites

## 📊 Metrics to Track

### Development Speed
- Time from requirement to implementation
- Number of iteration cycles
- Features completed per week

### Code Quality
- Test coverage percentage
- Bugs found in review
- Code review pass rate

### Planning Accuracy
- Spec changes during implementation
- Estimate vs actual time
- Rework percentage

## 🔧 Customization Options

### 1. **Adjust Agent Prompts**
Edit files in `.claude/agents/` to:
- Add project-specific context
- Emphasize certain practices
- Include domain knowledge

### 2. **Create Specialized Agents**
```yaml
# .claude/agents/scraper-expert.md
name: scraper-expert
description: Web scraping specialist for job boards
tools: [Read, Write, Bash, WebFetch]
```

### 3. **Modify Commands**
Enhance commands in `.claude/commands/` to:
- Add pre-flight checks
- Include automatic documentation
- Chain multiple agents

## 📚 Best Practices

### For Planner Agent
1. Always provide clear requirements
2. Ask for multiple approach evaluations
3. Request specific task breakdowns
4. Include acceptance criteria

### For Coder Agent
1. Provide the technical spec
2. Emphasize TDD approach
3. Specify code standards
4. Request documentation

### For Tester Agent
1. Provide implementation context
2. Ask for specific metrics
3. Request security review
4. Include performance checks

## 🎉 Next Steps

1. **Start Using Agents Today**
   - Begin with simple tasks
   - Gradually increase complexity
   - Track results and iterate

2. **Share Learnings**
   - Document what works
   - Create team patterns
   - Refine prompts together

3. **Expand System**
   - Add domain-specific agents
   - Create workflow templates
   - Build agent pipelines

## 💡 Pro Tips

1. **Let Agents Specialize** - Don't ask planner to code
2. **Provide Clear Context** - Better input = better output  
3. **Review Between Phases** - Quality gates matter
4. **Iterate on Prompts** - They improve with tuning
5. **Track Everything** - Metrics drive improvement

---

This enhanced development approach with specialized sub-agents will transform how we build JobDisco, delivering higher quality code faster with better planning and testing.