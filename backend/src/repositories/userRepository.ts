import { getDb } from '../db/index.js';

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
}

export class UserRepository {
  async findAll(): Promise<User[]> {
    const db = getDb();
    return await db.all('SELECT * FROM users');
  }

  async findById(id: number): Promise<User | undefined> {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE id = ?', id);
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE username = ?', username);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE email = ?', email);
  }

  async create(user: User): Promise<User> {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash, avatar_url, status) VALUES (?, ?, ?, ?, ?)',
      [user.username, user.email, user.password_hash, user.avatar_url, user.status || 'offline']
    );
    
    return {
      ...user,
      id: result.lastID
    };
  }

  async update(id: number, user: Partial<User>): Promise<void> {
    const db = getDb();
    const currentUser = await this.findById(id);
    
    if (!currentUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updates = [];
    const params = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(user)) {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    params.push(id); // For the WHERE clause
    
    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.run('DELETE FROM users WHERE id = ?', id);
  }
}

export default new UserRepository();