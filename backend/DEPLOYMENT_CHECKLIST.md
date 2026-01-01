# Deployment Checklist - Enhanced Matches API

## Pre-Deployment

### 1. Code Review
- [ ] Review all changes in `/backend/app/routers/matches.py`
- [ ] Review changes in `/backend/app/models.py`
- [ ] Verify migration file `/backend/migrations/002_add_expired_status.sql`
- [ ] Check for any hardcoded values or debug code
- [ ] Ensure all TODOs are addressed or documented

### 2. Testing
- [ ] Run unit tests: `pytest backend/tests/`
- [ ] Test all new endpoints with Postman/curl
- [ ] Test filtering combinations
- [ ] Test sorting options
- [ ] Test pagination edge cases
- [ ] Test expiration logic with various timestamps
- [ ] Test mutual connections with different scenarios
- [ ] Test follow-all with privacy settings
- [ ] Verify error responses (400, 403, 404)

### 3. Documentation
- [ ] API documentation is up to date
- [ ] Frontend integration guide is complete
- [ ] Migration instructions are clear
- [ ] Changelog is updated

## Database Migration

### Staging Environment

#### Step 1: Backup Database
```bash
# PostgreSQL
pg_dump -U vibeconnect_user -h staging-db.com vibeconnect_staging > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_staging_*.sql
```

#### Step 2: Apply Migration
```bash
# Apply the migration
psql -U vibeconnect_user -h staging-db.com -d vibeconnect_staging -f backend/migrations/002_add_expired_status.sql

# Check for errors
echo $?  # Should be 0
```

#### Step 3: Verify Migration
```bash
# Verify enum values
psql -U vibeconnect_user -h staging-db.com -d vibeconnect_staging -c "
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'matchstatus');
"

# Expected output:
# pending
# accepted
# rejected
# expired

# Check if expired matches were updated
psql -U vibeconnect_user -h staging-db.com -d vibeconnect_staging -c "
SELECT COUNT(*) as expired_count
FROM matches
WHERE status = 'expired';
"
```

#### Step 4: Create Indexes (Optional but Recommended)
```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_expires_at ON matches(expires_at ASC);
CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches(event_id);
CREATE INDEX IF NOT EXISTS idx_matches_compatibility ON matches(compatibility_score DESC);

-- Verify indexes
\di matches*
```

### Production Environment

#### Step 1: Backup Database
```bash
# Create backup
pg_dump -U vibeconnect_user -h production-db.com vibeconnect_prod > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Upload backup to S3 (recommended)
aws s3 cp backup_prod_*.sql s3://vibeconnect-backups/
```

#### Step 2: Schedule Maintenance Window
- [ ] Notify users about maintenance
- [ ] Set up status page update
- [ ] Schedule during low-traffic period

#### Step 3: Apply Migration
```bash
# Apply migration
psql -U vibeconnect_user -h production-db.com -d vibeconnect_prod -f backend/migrations/002_add_expired_status.sql
```

#### Step 4: Verify
```bash
# Same verification as staging
psql -U vibeconnect_user -h production-db.com -d vibeconnect_prod -c "
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'matchstatus');
"
```

## Application Deployment

### Staging Deployment

#### Step 1: Deploy Backend
```bash
# Pull latest code
git checkout main
git pull origin main

# Install dependencies (if any new)
cd backend
pip install -r requirements.txt

# Restart application
# If using systemd:
sudo systemctl restart vibeconnect-backend-staging

# If using Docker:
docker-compose -f docker-compose.staging.yml up -d --build

# If using Railway/Heroku:
# Deployment happens automatically on push
```

#### Step 2: Verify Deployment
```bash
# Health check
curl https://api-staging.vibeconnect.com/health

# Test new endpoint
curl "https://api-staging.vibeconnect.com/api/matches/?wallet_address=0x123...&status=pending"

# Check logs
tail -f /var/log/vibeconnect/backend.log
# or
docker logs vibeconnect-backend-staging -f
```

#### Step 3: Smoke Testing
- [ ] GET `/api/matches/` with various filters
- [ ] GET `/api/matches/mutual-connections`
- [ ] GET `/api/matches/{id}/follow-all`
- [ ] Verify existing endpoints still work
- [ ] Check response times (should be < 500ms)
- [ ] Monitor error rates

### Production Deployment

#### Step 1: Deploy Backend
```bash
# Tag release
git tag -a v1.1.0 -m "Enhanced matches feed with filtering and expiration"
git push origin v1.1.0

# Deploy (method depends on hosting)
# Railway: Auto-deploys on tag push
# Heroku: git push heroku main
# Docker: docker-compose up -d --build
```

#### Step 2: Monitoring Setup
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up alerts for:
  - High error rates (> 5%)
  - Slow queries (> 1s)
  - High expiration rates

#### Step 3: Gradual Rollout
```bash
# If using feature flags
# Enable for 10% of users first
curl -X POST https://api.vibeconnect.com/admin/feature-flags \
  -d '{"feature": "enhanced_matches", "enabled_percentage": 10}'

# Monitor for 1 hour, then increase to 50%
# Then 100% if all good
```

## Post-Deployment Verification

### Automated Tests
```bash
# Run integration tests against production
npm run test:integration:prod

# Run smoke tests
npm run test:smoke:prod
```

### Manual Verification
- [ ] Login to production app
- [ ] Navigate to connections page
- [ ] Verify filters work (pending, accepted, expired)
- [ ] Check sorting options (newest, compatibility, expiring soon)
- [ ] Test mutual connections display
- [ ] Test "Follow All" button on accepted connection
- [ ] Verify expiration timers show correctly
- [ ] Check pagination works
- [ ] Test event filtering

### Performance Checks
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "https://api.vibeconnect.com/api/matches/?wallet_address=0x123..."

# curl-format.txt:
# time_total: %{time_total}s
```

### Database Health
```sql
-- Check for slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%matches%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename = 'matches';

-- Check table size
SELECT
  pg_size_pretty(pg_total_relation_size('matches')) as total_size,
  pg_size_pretty(pg_relation_size('matches')) as table_size,
  pg_size_pretty(pg_indexes_size('matches')) as indexes_size;
```

## Monitoring & Alerts

### Key Metrics to Monitor

#### Application Metrics
- [ ] Request rate to new endpoints
- [ ] Response times (p50, p95, p99)
- [ ] Error rate
- [ ] Success rate of mutual connections queries
- [ ] Follow-all click-through rate

#### Database Metrics
- [ ] Query execution time
- [ ] Connection pool usage
- [ ] Index hit rate
- [ ] Table growth rate

#### Business Metrics
- [ ] Number of expired matches per day
- [ ] Expiration rate (% of pending matches that expire)
- [ ] Average time to respond to matches
- [ ] Mutual connections distribution

### Alert Thresholds
```yaml
# Example alert configuration
alerts:
  - name: High API Error Rate
    condition: error_rate > 5%
    severity: high
    notification: slack, pagerduty

  - name: Slow Match Queries
    condition: p95_response_time > 1000ms
    severity: medium
    notification: slack

  - name: Database Connection Pool Exhausted
    condition: connection_pool_usage > 90%
    severity: critical
    notification: pagerduty

  - name: High Expiration Rate
    condition: expiration_rate > 50%
    severity: low
    notification: slack
```

## Rollback Plan

### If Issues Detected

#### Application Rollback
```bash
# Revert to previous version
git revert v1.1.0
git push origin main

# Or redeploy previous version
git checkout v1.0.0
# Deploy using your method
```

#### Database Rollback
```sql
-- Remove EXPIRED status from enum (if needed)
-- WARNING: This will fail if any rows have status='expired'

-- First, update expired matches back to pending or rejected
UPDATE matches
SET status = 'rejected'
WHERE status = 'expired';

-- Then remove the enum value (PostgreSQL 12+)
-- Note: Cannot remove enum values in PostgreSQL < 12
ALTER TYPE matchstatus DROP VALUE 'expired';
```

#### Restore from Backup (Last Resort)
```bash
# Restore database from backup
psql -U vibeconnect_user -h production-db.com -d vibeconnect_prod < backup_prod_YYYYMMDD_HHMMSS.sql

# Verify restoration
psql -U vibeconnect_user -h production-db.com -d vibeconnect_prod -c "SELECT COUNT(*) FROM matches;"
```

## Communication

### Team Communication
- [ ] Notify backend team of deployment
- [ ] Inform frontend team that API is ready
- [ ] Update #engineering Slack channel
- [ ] Update deployment log

### User Communication (if applicable)
- [ ] Announce new features (connections feed enhancements)
- [ ] Update help documentation
- [ ] Create tutorial video (optional)

## Final Checklist

### Pre-Deployment
- [x] Code reviewed and approved
- [x] Tests passing
- [x] Documentation complete
- [ ] Migration tested on staging
- [ ] Indexes created
- [ ] Monitoring configured

### During Deployment
- [ ] Database backup created
- [ ] Migration applied successfully
- [ ] Application deployed
- [ ] Smoke tests passed
- [ ] No critical errors in logs

### Post-Deployment
- [ ] All endpoints responding correctly
- [ ] Performance within acceptable range
- [ ] No increase in error rate
- [ ] Frontend integration tested
- [ ] Team notified
- [ ] Documentation updated

## Success Criteria

Deployment is considered successful if:
- ✅ All new endpoints return 2xx responses
- ✅ Existing endpoints still function correctly
- ✅ No increase in error rate (< 1%)
- ✅ Response times within threshold (< 500ms p95)
- ✅ Database migration completed without errors
- ✅ No user complaints in first 24 hours

## Support & Escalation

### On-Call Contact
- Primary: [Backend Team Lead]
- Secondary: [DevOps Engineer]
- Escalation: [CTO]

### Resources
- API Documentation: `/backend/ENHANCED_MATCHES_API.md`
- Integration Guide: `/backend/FRONTEND_INTEGRATION_GUIDE.md`
- Runbook: [Link to runbook]
- Logs: [Link to logging dashboard]
- Metrics: [Link to metrics dashboard]

## Post-Mortem (if issues occurred)

If any issues occurred during deployment:
- [ ] Document what went wrong
- [ ] Root cause analysis
- [ ] Action items to prevent recurrence
- [ ] Update deployment checklist
- [ ] Share learnings with team

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Sign-off**: _____________
