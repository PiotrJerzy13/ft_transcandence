-- ft_transcendence Database Seed Data
-- This file contains initial data for development and testing

-- Insert default achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, requirement_type, requirement_value) VALUES
(1, 'First Victory', 'Win your first game', 'Trophy', 'first_win', 1),
(2, 'Speed Demon', 'Win a game in under 2 minutes', 'Zap', 'game_duration', 120),
(3, 'Unstoppable', 'Achieve a 5-game win streak', 'Target', 'win_streak', 5),
(4, 'Century Club', 'Play 100 games', 'Star', 'games_played', 100),
(5, 'Perfect Game', 'Win without opponent scoring', 'Crown', 'perfect_game', 1),
(6, 'Marathon', 'Play for 10 hours total', 'Clock', 'play_time', 600),
(7, 'Arkanoid Master', 'Reach level 10 in Arkanoid', 'Gamepad2', 'arkanoid_level', 10),
(8, 'High Scorer', 'Score over 10,000 points in Arkanoid', 'Zap', 'arkanoid_score', 10000),
(9, 'Pong Champion', 'Win 50 Pong matches', 'Trophy', 'pong_wins', 50),
(10, 'Tournament Victor', 'Win your first tournament', 'Crown', 'tournament_win', 1);

-- Insert sample users for development (passwords should be properly hashed in production)
INSERT OR IGNORE INTO users (id, username, email, password_hash, avatar_url, status) VALUES
(1, 'admin', 'admin@transcendence.com', '$2a$10$v5GwmgtkMBR3RhAb9zrX/u3Kc5vV/HC.mY6vLD2fI4zqGPOS.cvqm', '/avatars/admin.png', 'online'),
(2, 'player1', 'player1@example.com', '$2b$10$example_hash_2', '/avatars/player1.png', 'offline'),
(3, 'player2', 'player2@example.com', '$2b$10$example_hash_3', '/avatars/player2.png', 'online'),
(4, 'gamer_pro', 'gamer@example.com', '$2b$10$example_hash_4', '/avatars/gamer.png', 'offline'),
(5, 'newbie', 'newbie@example.com', '$2b$10$example_hash_5', '/avatars/newbie.png', 'online');

-- Insert user stats for sample users
INSERT OR IGNORE INTO user_stats (user_id, total_games, wins, losses, win_streak, best_streak, total_play_time, rank, level, xp) VALUES
(1, 150, 100, 50, 3, 12, 7200, 'Master', 15, 15000),
(2, 75, 45, 30, 5, 8, 3600, 'Expert', 8, 8000),
(3, 60, 30, 30, 2, 6, 2400, 'Intermediate', 6, 6000),
(4, 200, 120, 80, 7, 15, 12000, 'Grandmaster', 20, 25000),
(5, 10, 3, 7, 1, 2, 600, 'Novice', 2, 500);

-- Insert sample tournaments
INSERT OR IGNORE INTO tournaments (id, name, description, start_date, end_date, status, created_by) VALUES
(1, 'Summer Championship 2024', 'Annual summer tournament for all skill levels', '2024-07-01 10:00:00', '2024-07-07 18:00:00', 'completed', 1),
(2, 'Weekly Showdown #1', 'Weekly competitive tournament', '2024-08-01 19:00:00', '2024-08-01 22:00:00', 'completed', 1),
(3, 'Autumn Cup 2024', 'Seasonal tournament with prizes', '2024-09-15 14:00:00', '2024-09-22 20:00:00', 'active', 1),
(4, 'Beginner''s League', 'Tournament for new players', '2024-10-01 16:00:00', '2024-10-08 18:00:00', 'pending', 1);

-- Insert tournament participants
INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 5),
(2, 2), (2, 4),
(3, 1), (3, 2), (3, 3), (3, 4),
(4, 3), (4, 5);

-- Insert sample matches
INSERT OR IGNORE INTO matches (id, tournament_id, player1_id, player2_id, player1_score, player2_score, status, duration, played_at) VALUES
(1, 1, 2, 3, 11, 7, 'completed', 420, '2024-07-01 11:30:00'),
(2, 1, 4, 5, 11, 3, 'completed', 180, '2024-07-01 12:15:00'),
(3, 1, 2, 4, 8, 11, 'completed', 540, '2024-07-02 14:20:00'),
(4, 2, 2, 4, 11, 9, 'completed', 360, '2024-08-01 19:30:00'),
(5, 3, 1, 2, 11, 6, 'completed', 300, '2024-09-16 15:45:00'),
(6, NULL, 3, 5, 11, 4, 'completed', 240, '2024-09-20 20:10:00');

-- Insert sample Arkanoid scores
INSERT OR IGNORE INTO arkanoid_scores (user_id, score, xp, level_reached) VALUES
(1, 15000, 1500, 12),
(1, 18500, 1850, 15),
(2, 8500, 850, 8),
(2, 12000, 1200, 10),
(3, 5500, 550, 6),
(4, 25000, 2500, 20),
(4, 28000, 2800, 22),
(5, 2000, 200, 3);

-- Insert sample Pong matches
INSERT OR IGNORE INTO pong_matches (user_id, mode, score, opponent_score, winner, xp_earned, total_xp, created_at) VALUES
(1, 'one-player', 11, 7, 'player', 100, 14100, '2024-09-01T10:30:00Z'),
(1, 'two-player', 11, 9, 'player', 150, 14250, '2024-09-01T11:15:00Z'),
(2, 'one-player', 11, 5, 'player', 120, 7120, '2024-09-02T14:20:00Z'),
(2, 'two-player', 8, 11, 'opponent', 50, 7170, '2024-09-02T15:05:00Z'),
(3, 'one-player', 11, 3, 'player', 130, 5130, '2024-09-03T16:45:00Z'),
(4, 'two-player', 11, 6, 'player', 140, 24140, '2024-09-03T18:30:00Z'),
(5, 'one-player', 7, 11, 'opponent', 25, 525, '2024-09-04T12:00:00Z');

-- Insert some user achievements (users who have unlocked certain achievements)
INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, progress, unlocked_at) VALUES
(1, 1, 1, '2024-06-15 10:30:00'), -- First Victory
(1, 3, 5, '2024-07-20 14:45:00'), -- Unstoppable
(1, 4, 100, '2024-08-30 16:20:00'), -- Century Club
(2, 1, 1, '2024-06-20 12:15:00'), -- First Victory
(2, 5, 1, '2024-07-10 19:30:00'), -- Perfect Game
(3, 1, 1, '2024-06-25 15:45:00'), -- First Victory
(4, 1, 1, '2024-06-10 09:20:00'), -- First Victory
(4, 3, 5, '2024-07-05 11:10:00'), -- Unstoppable
(4, 4, 100, '2024-08-15 13:55:00'), -- Century Club
(4, 6, 600, '2024-09-01 17:40:00'), -- Marathon
(5, 1, 1, '2024-09-10 20:25:00'); -- First Victory