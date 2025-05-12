
/**
 * This script creates our database tables if they aren't already present.
 */

import db from './database.js';


// Variables -----------------------------------------------------------------------------------


const user_id_upper_cap = 14_776_336; // 62**4: Limit of unique user id with 4-digit base-62 user ids!
const game_id_upper_cap = 14_776_336; // 62**4: Limit of unique game id with 4-digit base-62 game ids!

/** All unique columns of the members table. Each of these would be valid to search for to find a single member. */
const uniqueMemberKeys = ['user_id', 'username', 'email'];

/** All columns of the members table. Each of these would be valid to retrieve from any member. */
const allMemberColumns = [
	'user_id',
	'username',
	'username_history',
	'email',
	'hashed_password',
	'roles',
	'joined',
	'last_seen',
	'refresh_tokens',
	'preferences',
	'verification',
	'login_count',
	'checkmates_beaten'
];

/** All columns of the player_stats table. Each of these would be valid to retrieve from any member. */
const allPlayerStatsColumns = [
	'user_id',
	'moves_played',
	'game_count',
	'game_count_rated',
	'game_count_casual',
	'game_count_public',
	'game_count_private',
	'game_count_wins',
	'game_count_losses',
	'game_count_draws',
	'game_count_aborted',
	'game_count_wins_rated',
	'game_count_losses_rated',
	'game_count_draws_rated',
	'game_count_wins_casual',
	'game_count_losses_casual',
	'game_count_draws_casual'
];

/** All columns of the player_stats table. Each of these would be valid to retrieve from any member. */
const allPlayerGamesColumns = [
	'user_id',
	'game_id',
	'player_number',
	'score',
	'elo_at_game',
	'elo_change_from_game'
];

/** All columns of the games table. Each of these would be valid to retrieve from any game. */
const allGamesColumns = [
	'game_id',
	'date',
	'base_time_seconds',
	'increment_seconds',
	'variant',
	'rated',
	'leaderboard_id',
	'private',
	'result',
	'termination',
	'move_count',
	'icn'
];


// Functions -----------------------------------------------------------------------------------


/** Creates the tables in our database if they do not exist. */
function generateTables() {
	// Members table
	db.run(`
		CREATE TABLE IF NOT EXISTS members (
			user_id INTEGER PRIMARY KEY,               
			username TEXT UNIQUE NOT NULL COLLATE NOCASE,
			email TEXT UNIQUE NOT NULL,                
			hashed_password TEXT NOT NULL,             
			roles TEXT,        
			joined TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,                         
			login_count INTEGER NOT NULL DEFAULT 0,                        
			preferences TEXT,
			refresh_tokens TEXT,                          
			verification TEXT, 
			username_history TEXT,
			checkmates_beaten TEXT NOT NULL DEFAULT ''
		);
	`);

	// Deleted Members table
	db.run(`
		CREATE TABLE IF NOT EXISTS deleted_members (
			user_id INTEGER PRIMARY KEY,             
			reason_deleted TEXT NOT NULL -- "unverified" / "user request" / "security"
		);
	`);

	// Leaderboards table
	db.run(`
		CREATE TABLE IF NOT EXISTS leaderboards (
        	user_id INTEGER NOT NULL REFERENCES members(user_id) ON DELETE CASCADE,
   			leaderboard_id INTEGER NOT NULL, -- Each leaderboard's id and variants are declared in the code
			elo REAL NOT NULL DEFAULT 1000.0,
			rating_deviation REAL NOT NULL DEFAULT 350.0,
			-- Add other Glicko fields if needed (volatility)
			last_rated_game_date TIMESTAMP,
			PRIMARY KEY (user_id, leaderboard_id) -- Composite key essential
		);
	`);

	// Indexes for leaderboards table

	// To quickly get all leaderboards for a specific user
	db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON leaderboards (user_id);`);
	// To quickly get rankings for a specific leaderboard (ESSENTIAL)
	db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboards_leaderboard_elo ON leaderboards (leaderboard_id, elo DESC);`);

	// Games table
	db.run(`
		CREATE TABLE IF NOT EXISTS games (
			game_id INTEGER PRIMARY KEY,
			date TIMESTAMP NOT NULL,
			base_time_seconds INTEGER, -- null if untimed
			increment_seconds INTEGER, -- null if untimed
			variant TEXT NOT NULL,
			rated BOOLEAN NOT NULL CHECK (rated IN (0, 1)), -- Ensures only 0 or 1
			leaderboard_id INTEGER, -- Specified only if the variant belongs to a leaderboard, ignoring whether the game was rated
			private BOOLEAN NOT NULL CHECK (private IN (0, 1)), -- Ensures only 0 or 1
			result TEXT NOT NULL,
			termination TEXT NOT NULL,
			move_count INTEGER NOT NULL,
			icn TEXT NOT NULL -- Also includes clock timestamps after each move

			-- Add a CHECK constraint to ensure consistency:
			-- EITHER both are NULL (untimed) OR both are NOT NULL and >= 0 (timed)
			CHECK (
				(base_time_seconds IS NULL AND increment_seconds IS NULL)
				OR
				(base_time_seconds > 0 AND increment_seconds >= 0)
			)
		);
	`);

	// Create an index on the date column of the games table for faster queries
	db.run(`CREATE INDEX IF NOT EXISTS idx_games_date ON games (date DESC);`);

	// Player Games Table
	db.run(`
		CREATE TABLE IF NOT EXISTS player_games (
			user_id INTEGER NOT NULL REFERENCES members(user_id), -- Account deletion does not delete rows in this table
			game_id INTEGER NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
			player_number INTEGER NOT NULL, -- 1 => White  2 => Black
			score REAL, -- 1 => Win   0.5 => Draw   0 => Loss   null => Aborted
			elo_at_game REAL, -- Specified if they have a rating for the leaderboard, ignoring whether the game was rated
			elo_change_from_game REAL, -- Specified only if the game was rated
			PRIMARY KEY (user_id, game_id) -- Ensures unique link
		);
	`);

	// Create an index for efficiently finding players in a specific game
	db.run(`CREATE INDEX IF NOT EXISTS idx_player_games_game ON player_games (game_id);`);

	// Player Stats table
	db.run(`
		CREATE TABLE IF NOT EXISTS player_stats (
			user_id INTEGER PRIMARY KEY REFERENCES members(user_id) ON DELETE CASCADE,
			moves_played INTEGER NOT NULL DEFAULT 0,
			game_count INTEGER NOT NULL DEFAULT 0,
			game_count_rated INTEGER NOT NULL DEFAULT 0,
			game_count_casual INTEGER NOT NULL DEFAULT 0,
			game_count_public INTEGER NOT NULL DEFAULT 0,
			game_count_private INTEGER NOT NULL DEFAULT 0,
			game_count_wins INTEGER NOT NULL DEFAULT 0,
			game_count_losses INTEGER NOT NULL DEFAULT 0,
			game_count_draws INTEGER NOT NULL DEFAULT 0,
			game_count_aborted INTEGER NOT NULL DEFAULT 0,
			game_count_wins_rated INTEGER NOT NULL DEFAULT 0,
			game_count_losses_rated INTEGER NOT NULL DEFAULT 0,
			game_count_draws_rated INTEGER NOT NULL DEFAULT 0,
			game_count_wins_casual INTEGER NOT NULL DEFAULT 0,
			game_count_losses_casual INTEGER NOT NULL DEFAULT 0,
			game_count_draws_casual INTEGER NOT NULL DEFAULT 0
		);
	`);

	// Bans table
	// createTableSQLQuery = `
	// 	CREATE TABLE IF NOT EXISTS bans (
	// 		emails TEXT DEFAULT '[]',
	// 		ips TEXT DEFAULT '[]',
	// 		browser_ids TEXT DEFAULT '[]'
	// 	)
	// `;
	// db.run(createTableSQLQuery);
}

/**
 * Deletes a table from the database by its name.
 * @param {string} tableName - The name of the table to delete.
 */
function deleteTable(tableName) {
	try {
		// Prepare the SQL query to drop the table
		const deleteTableSQL = `DROP TABLE IF EXISTS ${tableName};`;

		// Run the query
		db.run(deleteTableSQL);
		console.log(`Table ${tableName} deleted successfully.`);
	} catch (error) {
		console.error(`Error deleting table ${tableName}:`, error);
	}
}
// deleteTable('test');




export {
	user_id_upper_cap,
	game_id_upper_cap,
	uniqueMemberKeys,
	allMemberColumns,
	allPlayerStatsColumns,
	allPlayerGamesColumns,
	allGamesColumns,
	generateTables,
};
