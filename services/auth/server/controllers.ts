import { Request, Response } from 'express';
import { db } from './utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signupSchema } from './utils/schemas';
import { httpErrorResponse, throwHttpError } from './utils/error';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = await signupSchema
      .validate(req.body)
      .catch(throwHttpError(400));

    const [exists] = await db('users').where({ email });

    if (exists) throwHttpError(400, 'An account exists with this email');

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User created successfully', userId });
  } catch (err) {
    httpErrorResponse(res, err);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db('users').where({ email }).first();

    if (!user || !(await bcrypt.compare(password, user.password)))
      throwHttpError(401, 'Invalid credentials');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    httpErrorResponse(res, err);
  }
};

export const logout = async (req: Request, res: Response) => {
  // Usually, logout involves token management on the client side
  res.json({ message: 'Logged out successfully' });
};
