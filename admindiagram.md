# Cricket Management System Admin Diagrams

## Class Diagram

```mermaid
classDiagram
    class Management {
        +render()
    }

    class VenueManagement {
        -venues: Venue[]
        -loading: boolean
        -searchQuery: string
        -openDialog: boolean
        -selectedVenue: Venue | null
        -activeTab: string
        +fetchVenues()
        +handleCreateVenue(e)
        +handleEditVenue(venue)
        +handleDeleteVenue(id)
        +handleStatusChange(id, newStatus)
        +filterVenues()
        +getStatusBadge(status)
        +render()
    }

    class MatchScheduling {
        -matches: Match[]
        -tournaments: Tournament[]
        -teams: Team[]
        -filteredTeams: Team[]
        -tournamentManagers: User[]
        -users: User[]
        -loading: boolean
        -actionLoading: boolean
        -searchQuery: string
        -openDialog: boolean
        -openDeleteDialog: boolean
        -selectedMatch: Match | null
        -matchToDelete: Match | null
        -activeTab: string
        -currentPage: number
        -formData: object
        +fetchMatches()
        +fetchTournaments()
        +fetchTeams()
        +fetchTeamsForTournament(tournamentId)
        +fetchManagersForTournament(tournamentId)
        +handleTournamentChange(tournamentId)
        +handleInputChange(e)
        +handleSelectChange(name, value)
        +resetForm()
        +handleOpenNewMatchDialog()
        +handleCreateMatch(e)
        +handleEditMatch(match)
        +handleUpdateMatch(e)
        +handleOpenDeleteDialog(match)
        +handleDeleteMatch()
        +handleCancelMatch(match)
        +handleStartMatch(match)
        +filterMatches()
        +getCurrentPageItems()
        +getStatusBadge(status, date)
        +getMatchScore(match)
        +render()
    }

    class TeamManagement {
        -teams: Team[]
        -loading: boolean
        -searchQuery: string
        -debouncedSearchQuery: string
        -openDialog: boolean
        -selectedTeam: Team | null
        -activeTab: string
        -currentPage: number
        -openDeleteDialog: boolean
        -teamToDelete: Team | null
        -tournaments: Tournament[]
        -selectedTournament: string
        -openPlayersDialog: boolean
        -selectedTeamDetails: TeamWithPlayers | null
        -loadingPlayers: boolean
        -globalMode: boolean
        -isFormSubmitting: boolean
        -tournamentFilter: string
        -availablePlayers: AvailablePlayer[]
        -selectedPlayersToAdd: string[]
        -loadingAvailablePlayers: boolean
        -openManagePlayersDialog: boolean
        -selectedPlayerTeamId: string | null
        -searchPlayerQuery: string
        -isSavingPlayers: boolean
        +fetchTeams()
        +fetchTournaments()
        +handleCreateTeam(e)
        +handleEditTeam(team)
        +handleUpdateTeam(e)
        +handleOpenDeleteDialog(team)
        +handleDeleteTeam()
        +handleViewTeamPlayers(teamId, openDialog)
        +filterTeams()
        +getCurrentPageItems()
        +getStatusBadge(status)
        +handleDialogClose()
        +getRoleBadge(role)
        +getPlayerStatusBadge(status)
        +getInitials(name)
        +fetchAvailablePlayers(teamId)
        +handleOpenManagePlayers(teamId)
        +handleAddPlayersToTeam()
        +handleRemovePlayerFromTeam(teamId, playerId, playerName)
        +handleDesignateRole(teamId, playerId, role, playerName)
        +render()
    }

    class LiveScoring {
        -matches: Match[]
        -loading: boolean
        -refreshing: boolean
        -isProcessing: Record<string, boolean>
        -activeMatch: Match | null
        -activeInnings: Innings | null
        -scoringDialogOpen: boolean
        -startMatchDialogOpen: boolean
        -wicketDialogOpen: boolean
        -selectedBattingTeam: string
        -selectedTossWinner: string
        -tossDecision: string
        -selectedBatsman: string
        -selectedBowler: string
        -selectedFielder: string
        -wicketType: string
        -mockBatsmen: Player[]
        -mockBowlers: Player[]
        -realBatsmen: Player[]
        -realBowlers: Player[]
        -isLoadingPlayers: boolean
        -apiError: string | null
        -inningsDialogOpen: boolean
        -inningsBattingTeam: string
        -inningsBowlingTeam: string
        -inningsNumber: number
        -isCreatingInnings: boolean
        -activeBatsmen: string[]
        -strikeBatsman: string
        -nonStrikeBatsman: string
        -dismissedBatsmen: Set<string>
        -batsmenDialogOpen: boolean
        -newBatsmanMode: boolean
        +fetchMatches()
        +createMockPlayers(teamId, prefix)
        +handleStartMatch(matchId)
        +confirmStartMatch()
        +fetchTeamPlayers(teamId)
        +handleOpenScoring(match)
        +loadPlayers(currentInnings)
        +createNewInnings()
        +selectBatsmen(striker, nonStriker)
        +selectNewBatsman(newBatsman)
        +swapBatsmen()
        +createNewOver()
        +handleAddRuns(runs)
        +handleAddExtras(extraType, runs)
        +openWicketDialog()
        +handleWicket()
        +getStatusBadge(status)
        +formatMatchDate(dateString)
        +render()
    }

    class BallDisplay {
        +getBallText(ball)
        +getBallColor(ball)
        +render()
    }

    class AdminSettings {
        -loading: boolean
        -settingsData: object
        -teamMembers: TeamMember[]
        +handleSaveSettings()
        +handleBackupData()
        +handleRestoreData()
        +handleUpdateProfile(field, value)
        +handleUpdateNotifications(field, value)
        +handleUpdateSecurity(field, value)
        +handleUpdateSystem(field, value)
        +render()
    }

    class AdminOverview {
        -loading: boolean
        -overviewData: object
        +fetchOverviewData()
        +render()
    }

    class SignupPage {
        -user: {username: string, email: string, password: string, confirmPassword: string}
        -buttonDisabled: boolean
        -loading: boolean
        +onSignup()
        +render()
    }

    class LoginPage {
        -user: {email: string, password: string}
        +onLogin()
        +render()
    }
    
    class TournamentManagement {
        -tournaments: Tournament[]
        -loading: boolean
        -searchQuery: string
        -openDialog: boolean
        -selectedTournament: Tournament | null
        -activeTab: string
        -currentPage: number
        +fetchTournaments()
        +handleCreateTournament(e)
        +handleEditTournament(tournament)
        +handleDeleteTournament(id)
        +filterTournaments()
        +render()
    }
    
    class PlayerManagement {
        -players: Player[]
        -loading: boolean
        -searchQuery: string
        -openDialog: boolean
        -selectedPlayer: Player | null
        -activeTab: string
        -currentPage: number
        +fetchPlayers()
        +handleCreatePlayer(e)
        +handleEditPlayer(player)
        +handleDeletePlayer(id)
        +filterPlayers()
        +render()
    }

    Management --> VenueManagement
    Management --> MatchScheduling
    Management --> TeamManagement
    Management --> LiveScoring
    Management --> AdminSettings
    Management --> AdminOverview
    Management --> TournamentManagement
    Management --> PlayerManagement
    LiveScoring --> BallDisplay

    class Venue {
        +id: string
        +name: string
        +city: string
        +address: string
        +capacity: number
        +facilities: string[]
        +status: 'available' | 'maintenance' | 'booked'
        +pitchType: string
        +matchesHosted: number
        +image?: string
    }

    class Match {
        +_id: string
        +tournament_id: object
        +team1: Team
        +team2: Team
        +venue: string
        +date: string
        +time: string
        +status: string
        +innings?: Innings[]
        +match_format: string
        +handler: object
        +winningTeam?: string
        +cancellationReason?: string
        +match_type: string
        +overs?: number
        +id?: string
    }

    class Tournament {
        +_id: string
        +id?: string
        +tournamentName: string
        +status: string
        +userManagers?: object[]
        +teams?: number
    }

    class Team {
        +id: string
        +teamName: string
        +shortCode?: string
        +logo?: string
        +captain?: string
        +coach: string
        +players: number
        +playerCount?: number
        +status: 'active' | 'inactive'
        +tournament?: object
        +tournament_id?: string
        +wins?: number
        +losses?: number
    }

    class Player {
        +_id: string
        +playerName: string
        +role: string
        +battingStyle: string
        +bowlingStyle: string
        +status: string
        +isCaptain: boolean
        +isViceCaptain: boolean
        +isWicketKeeper: boolean
    }

    class Innings {
        +_id: string
        +team: {batting_team: Team, bowling_team: Team}
        +runs: number
        +wickets: number
        +overs: Over[]
        +extras: object
    }

    class Over {
        +_id: string
        +over_number: number
        +bowler: Player | string
        +balls: Ball[]
    }

    class Ball {
        +ball_number: number
        +batsman: Player | string
        +bowler: Player | string
        +runs: number
        +wicket: object
        +extras: object
    }
```

## Sequence Diagrams

### 1. Team Management Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant TeamManagement
    participant API
    participant TeamDialog
    participant PlayersDialog
    
    Admin->>TeamManagement: Opens team management interface
    TeamManagement->>API: fetchTeams()
    API-->>TeamManagement: Return teams data
    TeamManagement->>API: fetchTournaments()
    API-->>TeamManagement: Return tournaments data
    
    Admin->>TeamManagement: handleOpenNewTeamDialog()
    TeamManagement->>TeamDialog: Display team creation form
    Admin->>TeamDialog: Fill team details
    Admin->>TeamDialog: handleCreateTeam(e)
    TeamDialog->>API: POST /api/management/teams
    API-->>TeamDialog: Response with new team
    TeamDialog->>TeamManagement: Update teams list
    
    Admin->>TeamManagement: handleViewTeamPlayers(teamId)
    TeamManagement->>API: GET /api/management/teams/{teamId}
    API-->>TeamManagement: Return team with players
    TeamManagement->>PlayersDialog: Display team players
    
    Admin->>TeamManagement: handleOpenManagePlayers(teamId)
    TeamManagement->>API: fetchAvailablePlayers(teamId)
    API-->>TeamManagement: Return available players
    TeamManagement->>PlayersDialog: Display available players
    Admin->>PlayersDialog: Select players to add
    Admin->>PlayersDialog: handleAddPlayersToTeam()
    PlayersDialog->>API: POST /api/management/teams/players
    API-->>PlayersDialog: Confirm player assignments
```

### 2. Match Scheduling Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant MatchScheduling
    participant API
    participant MatchDialog
    
    Admin->>MatchScheduling: Opens match scheduling interface
    MatchScheduling->>API: fetchMatches()
    API-->>MatchScheduling: Return matches data
    MatchScheduling->>API: fetchTournaments()
    API-->>MatchScheduling: Return tournaments data
    MatchScheduling->>API: fetchTeams()
    API-->>MatchScheduling: Return teams data
    
    Admin->>MatchScheduling: handleOpenNewMatchDialog()
    MatchScheduling->>MatchDialog: Display match creation form
    Admin->>MatchDialog: Select tournament
    MatchDialog->>API: fetchTeamsForTournament(tournamentId)
    API-->>MatchDialog: Return teams for tournament
    MatchDialog->>API: fetchManagersForTournament(tournamentId)
    API-->>MatchDialog: Return managers for tournament
    
    Admin->>MatchDialog: Fill match details
    Admin->>MatchDialog: handleCreateMatch(e)
    MatchDialog->>API: POST /api/management/matches
    API-->>MatchDialog: Response with new match
    MatchDialog->>MatchScheduling: Update matches list
    
    Admin->>MatchScheduling: handleEditMatch(match)
    MatchScheduling->>MatchDialog: Display match edit form
    Admin->>MatchDialog: Update match details
    Admin->>MatchDialog: handleUpdateMatch(e)
    MatchDialog->>API: PUT /api/management/matches
    API-->>MatchDialog: Response with updated match
    MatchDialog->>MatchScheduling: Update matches list
```

### 3. Live Scoring Workflow

```mermaid
sequenceDiagram
    actor Scorer
    participant LiveScoring
    participant API
    participant ScoringDialog
    participant BallDisplay
    
    Scorer->>LiveScoring: Opens live scoring interface
    LiveScoring->>API: fetchMatches()
    API-->>LiveScoring: Return matches data
    
    Scorer->>LiveScoring: handleStartMatch(matchId)
    LiveScoring->>ScoringDialog: Display start match dialog
    Scorer->>ScoringDialog: Enter toss details
    Scorer->>ScoringDialog: confirmStartMatch()
    ScoringDialog->>API: PUT /api/management/live-score
    API-->>ScoringDialog: Return updated match
    
    Scorer->>LiveScoring: handleOpenScoring(match)
    LiveScoring->>API: GET /api/management/live-score/match-details/{match._id}
    API-->>LiveScoring: Return match details
    
    alt No innings exists
        LiveScoring->>ScoringDialog: Display innings creation dialog
        Scorer->>ScoringDialog: Select teams
        Scorer->>ScoringDialog: createNewInnings()
        ScoringDialog->>API: POST /api/management/innings
        API-->>ScoringDialog: Return new innings
    end
    
    LiveScoring->>API: loadPlayers(currentInnings)
    API-->>LiveScoring: Return players for teams
    
    LiveScoring->>ScoringDialog: Open batsmen dialog
    Scorer->>ScoringDialog: selectBatsmen(striker, nonStriker)
    
    Scorer->>ScoringDialog: Select bowler
    Scorer->>ScoringDialog: handleAddRuns(runs)
    ScoringDialog->>API: POST /api/management/ball-update
    API-->>ScoringDialog: Return updated innings
    ScoringDialog->>BallDisplay: Update ball display
    
    alt Wicket
        Scorer->>ScoringDialog: openWicketDialog()
        Scorer->>ScoringDialog: Select wicket type
        Scorer->>ScoringDialog: handleWicket()
        ScoringDialog->>API: POST /api/management/ball-update
        API-->>ScoringDialog: Return updated innings
        ScoringDialog->>LiveScoring: Update innings state
        LiveScoring->>ScoringDialog: Open new batsman dialog
        Scorer->>ScoringDialog: selectNewBatsman(newBatsman)
    end
```

### 4. Authentication Workflow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant SignupPage
    participant NextAuth
    participant Router
    
    alt New User
        User->>SignupPage: Access SignupPage
        User->>SignupPage: Enter username, email, password
        User->>SignupPage: onSignup()
        SignupPage->>NextAuth: signIn("credentials")
        NextAuth-->>SignupPage: Authentication Response
        alt Success
            SignupPage->>Router: router.push("/")
        else Failure
            NextAuth-->>SignupPage: Error Response
            SignupPage-->>User: Display Error Toast
        end
    else Existing User
        User->>LoginPage: Access LoginPage
        User->>LoginPage: Enter email, password
        User->>LoginPage: onLogin()
        LoginPage->>NextAuth: signIn("credentials")
        NextAuth-->>LoginPage: Authentication Response
        alt Success
            LoginPage-->>User: Display Success Toast
            LoginPage->>Router: router.push("/")
        else Failure
            NextAuth-->>LoginPage: Error Response
            LoginPage-->>User: Display Error Toast
        end
    end
```


### 6. Tournament Management Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant TournamentManagement
    participant API
    participant TournamentDialog
    
    Admin->>TournamentManagement: Opens tournament management interface
    TournamentManagement->>API: fetchTournaments()
    API-->>TournamentManagement: Return tournaments data
    
    Admin->>TournamentManagement: Click "New Tournament" button
    TournamentManagement->>TournamentDialog: Display tournament creation form
    Admin->>TournamentDialog: Fill tournament details
    Admin->>TournamentDialog: handleCreateTournament(e)
    TournamentDialog->>API: POST /api/management/tournaments
    API-->>TournamentDialog: Response with new tournament
    TournamentDialog->>TournamentManagement: Update tournaments list
    
    Admin->>TournamentManagement: handleEditTournament(tournament)
    TournamentManagement->>TournamentDialog: Display tournament edit form
    Admin->>TournamentDialog: Update tournament details
    Admin->>TournamentDialog: Submit form
    TournamentDialog->>API: PUT /api/management/tournaments
    API-->>TournamentDialog: Response with updated tournament
    TournamentDialog->>TournamentManagement: Update tournaments list
    
    Admin->>TournamentManagement: Click on tournament row
    TournamentManagement->>TournamentManagement: Display tournament details panel
    
    Admin->>TournamentManagement: handleDeleteTournament(id)
    TournamentManagement->>API: DELETE /api/management/tournaments
    API-->>TournamentManagement: Confirmation of deletion
    TournamentManagement->>TournamentManagement: Remove tournament from list
```

### 7. Player Management Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant PlayerManagement
    participant API
    participant PlayerDialog
    
    Admin->>PlayerManagement: Opens player management interface
    PlayerManagement->>API: fetchPlayers()
    API-->>PlayerManagement: Return players data
    
    Admin->>PlayerManagement: Click "New Player" button
    PlayerManagement->>PlayerDialog: Display player creation form
    Admin->>PlayerDialog: Fill player details
    Admin->>PlayerDialog: handleCreatePlayer(e)
    PlayerDialog->>API: POST /api/management/players
    API-->>PlayerDialog: Response with new player
    PlayerDialog->>PlayerManagement: Update players list
    
    Admin->>PlayerManagement: handleEditPlayer(player)
    PlayerManagement->>PlayerDialog: Display player edit form
    Admin->>PlayerDialog: Update player details
    Admin->>PlayerDialog: Submit form
    PlayerDialog->>API: PUT /api/management/players
    API-->>PlayerDialog: Response with updated player
    PlayerDialog->>PlayerManagement: Update players list
    
    Admin->>PlayerManagement: Filter players (by role, status)
    PlayerManagement->>PlayerManagement: Apply filters to players list
    PlayerManagement->>PlayerManagement: Update UI
    
    Admin->>PlayerManagement: handleDeletePlayer(id)
    PlayerManagement->>API: DELETE /api/management/players
    API-->>PlayerManagement: Confirmation of deletion
    PlayerManagement->>PlayerManagement: Remove player from list
```

### 8. Admin Settings Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant AdminSettings
    participant API
    participant SettingsForm
    
    Admin->>AdminSettings: Opens system settings interface
    AdminSettings->>API: GET /api/admin/settings
    API-->>AdminSettings: Return settings data
    AdminSettings->>AdminSettings: Populate settingsData state
    
    Admin->>AdminSettings: Select "Profile" tab
    AdminSettings->>SettingsForm: Display profile settings form
    Admin->>SettingsForm: Update profile details
    Admin->>SettingsForm: handleUpdateProfile(field, value)
    SettingsForm->>AdminSettings: Update settingsData.profile
    
    Admin->>AdminSettings: Select "Notifications" tab
    AdminSettings->>SettingsForm: Display notification settings
    Admin->>SettingsForm: Toggle notification preferences
    Admin->>SettingsForm: handleUpdateNotifications(field, value)
    SettingsForm->>AdminSettings: Update settingsData.notifications
    
    Admin->>AdminSettings: Select "Security" tab
    AdminSettings->>SettingsForm: Display security settings
    Admin->>SettingsForm: Toggle two-factor authentication
    Admin->>SettingsForm: handleUpdateSecurity(field, value)
    SettingsForm->>AdminSettings: Update settingsData.security
    
    Admin->>AdminSettings: Select "System" tab
    AdminSettings->>SettingsForm: Display system settings
    Admin->>SettingsForm: Change system preferences
    Admin->>SettingsForm: handleUpdateSystem(field, value)
    SettingsForm->>AdminSettings: Update settingsData.system
    
    Admin->>AdminSettings: Click "Save Settings"
    AdminSettings->>API: PUT /api/admin/settings
    API-->>AdminSettings: Confirmation of update
    
    Admin->>AdminSettings: Click "Backup System"
    AdminSettings->>API: POST /api/admin/backup
    API-->>AdminSettings: Return backup data
    
    Admin->>AdminSettings: Click "Restore"
    AdminSettings->>API: POST /api/admin/restore
    API-->>AdminSettings: Confirmation of restore
```

### 9. Admin Overview Dashboard Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant AdminOverview
    participant API
    
    Admin->>AdminOverview: Opens admin overview dashboard
    AdminOverview->>AdminOverview: fetchOverviewData()
    
    par Fetch Activity Data
        AdminOverview->>API: GET /api/admin/activity
        API-->>AdminOverview: Return recent activity data
    and Fetch Match Data
        AdminOverview->>API: GET /api/matches/upcoming
        API-->>AdminOverview: Return upcoming matches data
    and Fetch Alerts
        AdminOverview->>API: GET /api/admin/alerts
        API-->>AdminOverview: Return system alerts data
    end
    
    AdminOverview->>AdminOverview: Combine data into overviewData state
    AdminOverview->>AdminOverview: Render dashboard components
    
    Admin->>AdminOverview: Click "View All Activity"
    AdminOverview->>API: GET /api/admin/activity?full=true
    API-->>AdminOverview: Return complete activity log
    
    Admin->>AdminOverview: Click "View All Matches"
    AdminOverview->>API: GET /api/matches/upcoming?full=true
    API-->>AdminOverview: Return full upcoming matches list
    
    Admin->>AdminOverview: Click on specific alert
    AdminOverview->>API: GET /api/admin/alerts/{id}/details
    API-->>AdminOverview: Return detailed alert information
```
