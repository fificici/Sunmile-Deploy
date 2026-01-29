import { Request, Response } from 'express'
import { UserRepository } from '../repositories/UserRepository'
import { generateToken } from '../config/auth'
import { ProfessionalRepository } from '../repositories/ProfessionalRepository'
import * as bcrypt from 'bcryptjs'

const userRepository = new UserRepository()
const professionalRepository = new ProfessionalRepository()

export class AuthController {
	
	async login(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body

			if (!email || !password) {
				return res.status(400).json({ message: 'Email e senha são obrigatórios' })
			}

			const user = await userRepository.findByEmail(email)

			if (!user) {
				return res.status(401).json({ message: 'Email ou senha inválidos' })
			}

			const isValid = await bcrypt.compare(password, user.password)

			if (!isValid) {
				return res.status(401).json({ message: 'Email ou senha inválidos' })
			}

			const token = generateToken({ id: user.id, role: user.role })

			return res.status(200).json({
				message: 'Login realizado com sucesso',
				token: token
			})
		} catch (error) {
			console.error('Erro no login:', error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async meUser(req: Request, res: Response): Promise<Response> {
		try {
			const id = req.user.id
			const user = await userRepository.findById(id)

			if (!user) {
				return res.status(404).json({ message: 'Usuário não encontrado' })
			}

			return res.json(user)
		} catch (error) {
			console.error('Erro ao buscar usuário:', error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async meProfessional(req: Request, res: Response): Promise<Response> {
		try {
		  const userId = req.user.id
	  
		  const professional = await professionalRepository.findByUserId(userId)
	  
		  if (!professional) {
			return res.status(404).json({ message: 'Profissional não encontrado' })
		  }
	  
		  return res.json(professional)
	  
		} catch (error) {
		  console.error(error)
		  return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}  

	async logout(req: Request, res: Response): Promise<Response> {
		try {
			return res.status(200).json({ message: 'Logout realizado com sucesso' })
		} catch (error) {
			console.error('Erro no logout:', error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}
}
