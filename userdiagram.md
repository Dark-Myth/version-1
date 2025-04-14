# Cricket Tournament Management System Diagrams

## Class Diagram

```mermaid
classDiagram
    class Tournament {
        +String _id
        +String tournamentName
        +Date startDate
        +Date endDate
        +String venue
        +getAll()
        +getById(id)
        +getByYear(year)
    }
    
    class Team {
        +String _id
        +String teamName
        +String shortCode
        +Tournament tournament_id
        +Array~String~ players
        +Array~Player~ playersInfo
        +String status
        +String coach
        +String captain
        +Number playerCount
        +getByTournament(tournamentId)
        +getTeamDetails(id, tournamentId)
    }
    
    class Player {
        +String _id
        +String player_id
        +String name
        +String role
        +String originalRole
        +String battingStyle
        +String bowlingStyle
        +String status
        +Boolean isCapt
        +Boolean isViceCapt
        +Boolean isWicketKeeper
        +PlayerStats globalStats
        +PlayerStats tournamentStats
        +getById(id)
        +getByTeam(teamId)
    }
    
    class PlayerStats {
        +BattingStats batting
        +BowlingStats bowling
        +FieldingStats fielding
    }
    
    class BattingStats {
        +Number matches
        +Number runs
        +Number strikeRate
        +Number average
        +Number fifties
        +Number centuries
        +Number ballsFaced
    }
    
    class BowlingStats {
        +Number matches
        +Number oversBowled
        +Number wickets
        +Number economyRate
        +Number bowlingAverage
        +String bestFigures
    }
    
    class FieldingStats {
        +Number catches
        +Number stumpings
    }
    
    class Match {
        +String _id
        +Tournament tournament_id
        +Team team1
        +Team team2
        +Date date
        +String time
        +String venue
        +Array~Innings~ innings
        +String status
        +Team winningTeam
        +String match_type
        +String match_format
        +Number overs
        +String comments
        +getByYear(year)
        +getByTournament(tournamentId)
        +getLiveMatches()
        +getById(id)
        +getFilteredMatches(filters)
    }
    
    class Innings {
        +String _id
        +Object teamData
        +Number runs
        +Number wickets
        +Array~Over~ overs
        +Object extrasData
        +getByMatchId(matchId)
    }
    
    class Over {
        +String _id
        +Number over_number
        +String bowler
        +Array~Ball~ balls
    }
    
    class Ball {
        +Number ball_number
        +Object batsmanData
        +Object bowlerData
        +Number runs
        +Object wicketData
        +Object extrasData
    }
    
    class TeamPoints {
        +String team_id
        +String teamName
        +Number matchesPlayed
        +Number matchesWon
        +Number matchesLost
        +Number points
        +Number netRunRate
        +getByTournament(tournamentId)
    }
    
    class TeamDetailsPage {
        -useState(loading, teamDetails, activeTab, statView)
        -useEffect(fetchTeamDetails)
        -useParams(id)
        -useRouter()
        +fetchTeamDetails()
        +formatDate(dateString)
        +getStatusColor(status)
        +getInitials(name)
        +getRoleBadgeColor(role)
        +getBattingPlayers()
        +getBowlingPlayers()
        +getFieldingPlayers()
    }
    
    class PointsTablePage {
        -useState(tournaments, selectedYear, selectedTournament, pointsTable, filteredTournaments, loading)
        -useEffect(fetchTournaments, filterTournaments, fetchPointsTable)
        +fetchTournaments()
        +fetchPointsTable(tournamentId)
    }
    
    class LiveScorePage {
        -useState(matches, loading, refreshing, selectedMatch, expandedMatches, autoRefresh)
        -useEffect(fetchLiveMatches, autoRefreshInterval)
        +fetchLiveMatches()
        +toggleExpand(matchId)
        +formatMatchDate(dateString)
        +formatMatchTime(timeString)
        +getMatchStatus(match)
        +getCurrentInnings(match)
        +getTeamScores(match)
        +getRunRate(runs, overs)
        +getRequiredRunRate(match)
        +getTarget(match)
        +getLastFiveBalls(match)
        +getMatchResult(match)
    }
    
    class MatchesPage {
        -useState(matches, filteredMatches, tournaments, selectedYear, selectedTournament, selectedType, selectedFormat, searchQuery, loading, activeTab)
        -useEffect(fetchTournaments, fetchMatches, applyFilters)
        +fetchTournaments()
        +fetchMatches(year, tournamentId)
        +applyFilters(matchesData)
        +formatMatchDate(dateString)
        +formatMatchTime(timeString)
        +getMatchFormatDisplay(format, overs)
    }
    
    class TeamsPage {
        -useState(teams, filteredTeams, tournaments, selectedYear, selectedTournament, filteredTournaments, searchQuery, loading)
        -useEffect(fetchTournaments, filterTournamentsByYear, fetchTeamsForTournament, filterTeamsBySearch)
        +fetchTournaments()
        +fetchTeamsForTournament(tournamentId)
        +getStatusColor(status)
    }
    
    Tournament "1" -- "*" Team: has
    Tournament "1" -- "*" Match: hosts
    Team "1" -- "*" Player: contains
    Team "1" -- "*" TeamPoints: earns
    Match "1" -- "2" Team: played between
    Match "1" -- "*" Innings: has
    Innings "1" -- "*" Over: contains
    Over "1" -- "*" Ball: includes
    Player "1" -- "1" PlayerStats: has
    PlayerStats "1" -- "1" BattingStats: includes
    PlayerStats "1" -- "1" BowlingStats: includes
    PlayerStats "1" -- "1" FieldingStats: includes
    
    TeamDetailsPage --> Team: uses
    TeamDetailsPage --> Player: uses
    PointsTablePage --> Tournament: uses
    PointsTablePage --> TeamPoints: uses
    LiveScorePage --> Match: uses
    LiveScorePage --> Innings: uses
    MatchesPage --> Tournament: uses
    MatchesPage --> Match: uses
    TeamsPage --> Tournament: uses
    TeamsPage --> Team: uses
## Sequence Diagram - Team Details Page

```mermaid
sequenceDiagram
    participant Client
    participant TeamDetailsPage
    participant API
    participant TeamModel
    participant PlayerModel
    participant Database
    
    Client->>TeamDetailsPage: Navigate to team-details/[id]
    Note over TeamDetailsPage: useParams to get id and tournament_id
    
    TeamDetailsPage->>TeamDetailsPage: fetchTeamDetails()
    TeamDetailsPage->>API: GET /api/teams/team-details/{id}?tournament_id={tournament_id}
    API->>TeamModel: Find team by ID
    TeamModel->>Database: Query team
    Database-->>TeamModel: Team data
    
    API->>PlayerModel: Find players info
    PlayerModel->>Database: Query players
    Database-->>PlayerModel: Players data
    
    API->>TeamModel: Populate players info
    TeamModel-->>API: Complete team data with players
    
    API-->>TeamDetailsPage: Team details response
    
    TeamDetailsPage->>TeamDetailsPage: formatDate()
    TeamDetailsPage->>TeamDetailsPage: getStatusColor()
    TeamDetailsPage->>TeamDetailsPage: getInitials()
    
    TeamDetailsPage->>Client: Render team details UI
    
    alt Tab selection = "overview"
        Client->>TeamDetailsPage: Click on "Overview" tab
        TeamDetailsPage->>Client: Display player grid with getInitials()
    else Tab selection = "players"
        Client->>TeamDetailsPage: Click on "Players" tab  
        TeamDetailsPage->>TeamDetailsPage: getRoleBadgeColor()
        TeamDetailsPage->>Client: Display detailed player info
    else Tab selection = "stats"
        Client->>TeamDetailsPage: Click on "Stats" tab
        TeamDetailsPage->>TeamDetailsPage: getBattingPlayers()
        TeamDetailsPage->>TeamDetailsPage: getBowlingPlayers()
        TeamDetailsPage->>TeamDetailsPage: getFieldingPlayers()
        TeamDetailsPage->>Client: Display batting/bowling/fielding stats
    end
```

## Sequence Diagram - Points Table Page

```mermaid
sequenceDiagram
    participant Client
    participant PointsTablePage
    participant API
    participant TournamentModel
    participant TeamPointsModel
    participant Database
    
    Client->>PointsTablePage: Navigate to point-table
    
    PointsTablePage->>PointsTablePage: fetchTournaments()
    PointsTablePage->>API: GET /api/tournaments
    API->>TournamentModel: Get all tournaments
    TournamentModel->>Database: Query tournaments
    Database-->>TournamentModel: Tournaments data
    API-->>PointsTablePage: Tournaments list
    
    Note over PointsTablePage: Set default selected year and tournament
    
    PointsTablePage->>PointsTablePage: fetchPointsTable(selectedTournament)
    PointsTablePage->>API: GET /api/pointsTable?tournamentId={selectedTournament}
    API->>TeamPointsModel: Find points by tournament ID
    TeamPointsModel->>Database: Query points table
    Database-->>TeamPointsModel: Points table data
    API-->>PointsTablePage: Points table response
    
    PointsTablePage->>Client: Render points table
    
    alt Year selection changed
        Client->>PointsTablePage: Select different year
        PointsTablePage->>PointsTablePage: Filter tournaments by year
        PointsTablePage->>Client: Update tournament selector
    else
        Client->>PointsTablePage: Select different tournament
        PointsTablePage->>PointsTablePage: fetchPointsTable(newTournament)
        PointsTablePage->>API: GET /api/pointsTable?tournamentId={newTournament}
        API-->>PointsTablePage: Updated points table
        PointsTablePage->>Client: Render updated points table
    end
```

## Sequence Diagram - Live Score Page

```mermaid
sequenceDiagram
    participant Client
    participant LiveScorePage
    participant API
    participant MatchModel
    participant InningsModel
    participant Database
    
    Client->>LiveScorePage: Navigate to live-score
    
    LiveScorePage->>LiveScorePage: fetchLiveMatches()
    LiveScorePage->>API: GET /api/live-score
    API->>MatchModel: Find live matches with status "ongoing"
    MatchModel->>Database: Query matches
    Database-->>MatchModel: Live matches data
    
    API->>InningsModel: Get innings details for matches
    InningsModel->>Database: Query innings data
    Database-->>InningsModel: Innings data
    
    API-->>LiveScorePage: Complete live match data
    
    LiveScorePage->>LiveScorePage: Process match data with:
    Note over LiveScorePage: getTeamScores(), getRunRate(), getTarget()
    
    LiveScorePage->>Client: Render live scores with formatMatchDate(), formatMatchTime()
    
    Note over LiveScorePage: Auto-refresh enabled
    loop Every 30 seconds if autoRefresh is true
        LiveScorePage->>LiveScorePage: fetchLiveMatches()
        LiveScorePage->>API: GET /api/live-score
        API-->>LiveScorePage: Updated live match data
        LiveScorePage->>Client: Update UI with new data
    end
    
    alt Match expanded
        Client->>LiveScorePage: Click "Show Details"
        LiveScorePage->>LiveScorePage: toggleExpand(matchId)
        LiveScorePage->>Client: Expand match details
        Client->>LiveScorePage: Select tab (Innings/Scorecard)
        LiveScorePage->>LiveScorePage: getCurrentInnings()
        LiveScorePage->>LiveScorePage: getLastFiveBalls() or getMatchResult()
        LiveScorePage->>Client: Show selected content
    end
```

## Sequence Diagram - Matches Page

```mermaid
sequenceDiagram
    participant Client
    participant MatchesPage
    participant API
    participant TournamentModel
    participant MatchModel
    participant Database
    
    Client->>MatchesPage: Navigate to matches
    
    MatchesPage->>MatchesPage: fetchTournaments()
    MatchesPage->>API: GET /api/tournaments
    API->>TournamentModel: Get all tournaments
    TournamentModel->>Database: Query tournaments
    Database-->>TournamentModel: Tournaments data
    API-->>MatchesPage: Tournaments list
    
    Note over MatchesPage: Set default selected year
    
    MatchesPage->>MatchesPage: fetchMatches(selectedYear, null)
    MatchesPage->>API: GET /api/matches?year={selectedYear}
    API->>MatchModel: Find matches for year
    MatchModel->>Database: Query matches
    Database-->>MatchModel: Matches data
    API-->>MatchesPage: Matches response
    
    MatchesPage->>MatchesPage: applyFilters(matches)
    MatchesPage->>MatchesPage: formatMatchDate() and formatMatchTime()
    MatchesPage->>Client: Render filtered matches
    
    alt Tab selection changed
        Client->>MatchesPage: Select tab (upcoming/live/completed/all)
        MatchesPage->>MatchesPage: Update activeTab state
        MatchesPage->>MatchesPage: applyFilters(matches)
        MatchesPage->>Client: Update matches list
    else 
        Client->>MatchesPage: Change search query
        MatchesPage->>MatchesPage: Update searchQuery state
        MatchesPage->>MatchesPage: applyFilters(matches)
        MatchesPage->>Client: Update matches list
    else
        Client->>MatchesPage: Change tournament/year/type/format
        MatchesPage->>MatchesPage: fetchMatches() with new filters
        MatchesPage->>API: GET /api/matches with new filters
        API->>MatchModel: Find matches with filters
        MatchModel->>Database: Query filtered matches
        Database-->>MatchModel: Filtered matches data
        API-->>MatchesPage: Filtered matches
        MatchesPage->>MatchesPage: applyFilters(matchesData)
        MatchesPage->>MatchesPage: getMatchFormatDisplay()
        MatchesPage->>Client: Render new matches
    end
```

## Sequence Diagram - Teams Page

```mermaid
sequenceDiagram
    participant Client
    participant TeamsPage
    participant API
    participant TournamentModel
    participant TeamModel
    participant Database
    
    Client->>TeamsPage: Navigate to teams
    
    TeamsPage->>TeamsPage: fetchTournaments()
    TeamsPage->>API: GET /api/tournaments
    API->>TournamentModel: Get all tournaments
    TournamentModel->>Database: Query tournaments
    Database-->>TournamentModel: Tournaments data
    API-->>TeamsPage: Tournaments list
    
    Note over TeamsPage: Set default selected year and tournament
    
    TeamsPage->>TeamsPage: fetchTeamsForTournament(selectedTournament)
    TeamsPage->>API: GET /api/teams?tournamentId={selectedTournament}
    API->>TeamModel: Find teams for tournament
    TeamModel->>Database: Query teams
    Database-->>TeamModel: Teams data
    API-->>TeamsPage: Teams response
    
    TeamsPage->>TeamsPage: Apply getStatusColor()
    TeamsPage->>Client: Render teams grid
    
    alt Search query changed
        Client->>TeamsPage: Type in search box
        TeamsPage->>TeamsPage: Update searchQuery state
        TeamsPage->>TeamsPage: Filter teams by query
        TeamsPage->>Client: Update teams list
    else
        Client->>TeamsPage: Change year/tournament
        TeamsPage->>TeamsPage: fetchTeamsForTournament(newTournament)
        TeamsPage->>API: GET /api/teams?tournamentId={newTournament}
        API->>TeamModel: Find teams for new tournament
        TeamModel->>Database: Query teams
        Database-->>TeamModel: Updated teams data
        API-->>TeamsPage: Updated teams list
        TeamsPage->>Client: Render new teams
    end
    
    Client->>TeamsPage: Click on team
    TeamsPage->>Client: Navigate to team-details/[id]
```
