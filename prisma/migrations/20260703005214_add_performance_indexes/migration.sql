-- CreateIndex
CREATE INDEX "audit_logs_organizerId_createdAt_idx" ON "audit_logs"("organizerId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "bracket_nodes_stageId_idx" ON "bracket_nodes"("stageId");

-- CreateIndex
CREATE INDEX "bracket_nodes_parentNodeId_idx" ON "bracket_nodes"("parentNodeId");

-- CreateIndex
CREATE INDEX "bracket_nodes_teamId_idx" ON "bracket_nodes"("teamId");

-- CreateIndex
CREATE INDEX "court_assignments_courtId_idx" ON "court_assignments"("courtId");

-- CreateIndex
CREATE INDEX "courts_venueId_idx" ON "courts"("venueId");

-- CreateIndex
CREATE INDEX "group_standings_teamId_idx" ON "group_standings"("teamId");

-- CreateIndex
CREATE INDEX "groups_stageId_idx" ON "groups"("stageId");

-- CreateIndex
CREATE INDEX "match_teams_teamId_idx" ON "match_teams"("teamId");

-- CreateIndex
CREATE INDEX "matches_stageId_idx" ON "matches"("stageId");

-- CreateIndex
CREATE INDEX "matches_groupId_idx" ON "matches"("groupId");

-- CreateIndex
CREATE INDEX "matches_status_scheduledAt_idx" ON "matches"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ranking_entries_playerProfileId_idx" ON "ranking_entries"("playerProfileId");

-- CreateIndex
CREATE INDEX "ranking_entries_teamId_idx" ON "ranking_entries"("teamId");

-- CreateIndex
CREATE INDEX "ranking_movement_history_rankingEntryId_idx" ON "ranking_movement_history"("rankingEntryId");

-- CreateIndex
CREATE INDEX "ranking_rules_rankingTableId_idx" ON "ranking_rules"("rankingTableId");

-- CreateIndex
CREATE INDEX "ranking_tables_organizerId_idx" ON "ranking_tables"("organizerId");

-- CreateIndex
CREATE INDEX "registrations_teamId_idx" ON "registrations"("teamId");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "reschedule_history_matchId_idx" ON "reschedule_history"("matchId");

-- CreateIndex
CREATE INDEX "schedule_slots_tournamentId_date_idx" ON "schedule_slots"("tournamentId", "date");

-- CreateIndex
CREATE INDEX "schedule_slots_venueId_idx" ON "schedule_slots"("venueId");

-- CreateIndex
CREATE INDEX "stages_tournamentCategoryId_idx" ON "stages"("tournamentCategoryId");

-- CreateIndex
CREATE INDEX "team_players_playerProfileId_idx" ON "team_players"("playerProfileId");

-- CreateIndex
CREATE INDEX "tournament_access_tournamentId_idx" ON "tournament_access"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_categories_categoryId_idx" ON "tournament_categories"("categoryId");

-- CreateIndex
CREATE INDEX "tournaments_organizerId_status_idx" ON "tournaments"("organizerId", "status");

-- CreateIndex
CREATE INDEX "tournaments_isPublic_status_idx" ON "tournaments"("isPublic", "status");

-- CreateIndex
CREATE INDEX "user_organizers_organizerId_idx" ON "user_organizers"("organizerId");

-- CreateIndex
CREATE INDEX "venues_organizerId_idx" ON "venues"("organizerId");

-- CreateIndex
CREATE INDEX "waitlist_entries_teamId_idx" ON "waitlist_entries"("teamId");
