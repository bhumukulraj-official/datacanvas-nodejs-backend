const { UserRepository } = require('../../../data/repositories/auth');
const passwordUtil = require('../../utils/password.util');
const { DuplicateResourceError } = require('../../utils/error.util');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(userData) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new DuplicateResourceError('User', 'email', userData.email);
    }

    const hashedPassword = await passwordUtil.hashPassword(userData.password);
    return this.userRepository.create({
      ...userData,
      password_hash: hashedPassword
    });
  }

  async getProfile(userId) {
    const user = await this.userRepository.getWithRoles(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return this._sanitizeUser(user);
  }

  async updateProfile(userId, updateData) {
    if (updateData.password) {
      updateData.password_hash = await passwordUtil.hashPassword(updateData.password);
      delete updateData.password;
    }
    
    const [affectedCount] = await this.userRepository.update(userId, updateData);
    if (affectedCount === 0) {
      throw new CustomError('User not found', 404);
    }
    
    return this.getProfile(userId);
  }

  _sanitizeUser(user) {
    const { password_hash, ...userData } = user.get({ plain: true });
    return userData;
  }
}

module.exports = new UserService(); 