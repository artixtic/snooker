# Games and Tables Management

## Overview

The Snooker Club POS system now supports multiple game types, each with their own tables and billing rates. Tables are organized by games, and each game can have different rate types (per minute or per hour).

## Games

### Game Properties

- **Name**: Unique identifier for the game (e.g., "Snooker", "Table Tennis")
- **Description**: Optional description of the game
- **Rate Type**: Either `PER_MINUTE` or `PER_HOUR`
- **Default Rate**: Default billing rate in PKR (e.g., 8 PKR/min or 200 PKR/hour)
- **Active Status**: Whether the game is currently active

### Default Games

The system comes with 4 default games:

1. **Snooker** - Per Minute (8 PKR/min)
2. **Table Tennis** - Per Minute (6 PKR/min)
3. **PlayStation** - Per Hour (200 PKR/hour)
4. **Foosball** - Per Minute (5 PKR/min)

### Managing Games

#### Create a Game

1. Click "Manage Games" button in the dashboard header
2. Fill in the game details:
   - Game Name (required)
   - Description (optional)
   - Rate Type: Per Minute or Per Hour
   - Default Rate (required)
3. Click "Add Game"

#### Edit a Game

1. Open "Manage Games" dialog
2. Click the edit icon next to the game
3. Modify the fields
4. Click "Save"

#### Delete a Game

1. Open "Manage Games" dialog
2. Click the delete icon next to the game
3. Confirm deletion

**Note**: You cannot delete a game if it has any tables linked to it. You must delete or reassign all tables first.

## Tables

### Table Properties

- **Table Number**: Unique numeric identifier
- **Game**: Required - must be linked to a game
- **Status**: AVAILABLE, OCCUPIED, or PAUSED
- **Rate**: Current billing rate (inherits from game's default rate)
- **Timer**: Tracks active time, paused time, and current charge

### Table Naming

Tables are displayed with their game name and a relative number within that game:

- **Snooker 1**, **Snooker 2** (first and second Snooker tables)
- **Table Tennis 1**, **Table Tennis 2** (first and second Table Tennis tables)
- **PlayStation 1**, **PlayStation 2** (first and second PlayStation stations)

The numbering is relative to each game, not global.

### Creating Tables

1. Click "New Table" button in the dashboard header
2. Enter the table number
3. **Select a game** (required)
4. Click "Create Table"

The table will inherit the game's default rate.

### Starting a Table

1. **Prerequisite**: An active shift must be started
2. Click on an available table card
3. Optionally adjust the rate per minute/hour
4. Optionally set a discount
5. Click "Check In"

The table timer starts and billing begins based on the game's rate type.

### Table Operations

- **Pause**: Temporarily pause billing (table remains occupied)
- **Resume**: Continue billing from where it was paused
- **Check Out**: Complete the session and create a sale
- **Reset**: Clear table without creating a sale (admin only)

### Deleting Tables

- **Single Table**: Click the delete icon on the table card
- **All Tables**: Use "Delete All Tables" option (admin only)

## Rate Calculation

### Per Minute Games

For games with `PER_MINUTE` rate type:
- Rate is charged per minute of active play
- Example: 8 PKR/min × 60 minutes = 480 PKR/hour

### Per Hour Games

For games with `PER_HOUR` rate type:
- Rate is charged per hour of active play
- Example: 200 PKR/hour × 2 hours = 400 PKR

### Paused Time

- When a table is paused, billing stops
- Paused time is tracked separately
- Only active time is billed

## Dashboard Organization

Tables are grouped by game in the dashboard:

```
🎮 Snooker [Per Minute]
  🎱 Snooker 1 [Available]
  🎱 Snooker 2 [Occupied]

🎮 Table Tennis [Per Minute]
  🎱 Table Tennis 1 [Available]
  🎱 Table Tennis 2 [Available]

🎮 PlayStation [Per Hour]
  🎱 PlayStation 1 [Available]
  🎱 PlayStation 2 [Paused]
```

## Reports and Analytics

### Shift Closing Reports

Shift closing reports show revenue breakdown by game:

- **Snooker**: PKR 1,200 (15 sessions)
- **Table Tennis**: PKR 600 (10 sessions)
- **PlayStation**: PKR 400 (2 sessions)
- **Foosball**: PKR 300 (6 sessions)
- **Canteen**: PKR 500
- **Total Sales**: PKR 3,000

### Custom Reports

Custom reports also group revenue by games, allowing you to analyze performance per game type.

## Best Practices

1. **Create games first** before creating tables
2. **Set appropriate default rates** for each game
3. **Use descriptive game names** for easy identification
4. **Keep games active** only if they're currently in use
5. **Review game performance** regularly through reports

## API Endpoints

### Games

- `GET /games` - List all games
- `POST /games` - Create a game
- `PATCH /games/:id` - Update a game
- `DELETE /games/:id` - Delete a game

### Tables

- `GET /tables` - List all tables (includes game info)
- `POST /tables` - Create a table (requires gameId)
- `POST /tables/:id/start` - Start table session
- `POST /tables/:id/pause` - Pause table session
- `POST /tables/:id/resume` - Resume table session
- `POST /tables/:id/stop` - Stop table session
- `DELETE /tables/:id` - Delete a table
- `DELETE /tables` - Delete all tables

