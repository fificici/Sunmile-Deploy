import { Request, Response } from 'express'
import { UserRepository } from '../repositories/UserRepository'
import * as bcrypt from "bcryptjs"
import {
	verifyBirthDate,
	verifyPassword,
	verifyCPF,
	verifyUsername,
	verifyEmail
} from '../helpers/helpers'

const userRepository = new UserRepository()

export class UserController {
	async createUser(req: Request, res: Response): Promise<Response> {
	  try {
	    const { name, username, email, cpf, birth_date, password } = req.body
	
	    if (!name || !email || !password || !username || !cpf || !birth_date) {
	      return res
	        .status(400)
	        .json({ message: 'Informações obrigatórias não preenchidas' })
	    }
	
	    const userExists = await userRepository.findByEmail(email)
	    const usernameExists = await userRepository.findByUsername(username)
		const cpfExists = await userRepository.findByCPF(cpf)
	    const birthDateValid = verifyBirthDate(birth_date)
	    const passwordValid = verifyPassword(password)
	    const cpfValid = verifyCPF(cpf)
	    const usernameValid = verifyUsername(username)
	    const emailValid = verifyEmail(email)
	
	    if (userExists) return res.status(409).json({ message: 'Email já está em uso' })
	    if (usernameExists) return res.status(409).json({ message: 'Nome de usuário já está em uso' })
		if (cpfExists) return res.status(409).json({ message: 'CPF já cadastrado'})
	    if (!birthDateValid) return res.status(409).json({ message: 'Data de nascimento inválida ou idade não permitida' })
	    if (!passwordValid) return res.status(409).json({ message: 'Senha fraca (Minímo 6 caracteres - 1 maiúsculo - 1 minúsculo - 1 número - 1 caractere especial)' })
	    if (!cpfValid) return res.status(409).json({ message: 'CPF inválido' })
	    if (!usernameValid) return res.status(409).json({ message: 'Nome de usuário inválido. Use apenas letras, números, ponto e underline' })
	    if (!emailValid) return res.status(409).json({ message: 'Email inválido' })
	
	    const user = await userRepository.createAndSave({
	      name,
	      username,
	      email,
	      cpf,
	      birth_date,
	      password
	    })
	
	    return res.status(201).json(user)
	
	  } catch (error) {
	    console.error('Erro completo ao criar usuário:', error)
	    return res.status(500).json({
	      message: error instanceof Error ? error.message : 'Erro desconhecido',
	      stack: error instanceof Error ? error.stack : ''
	    })
	  }
	}

	async updateUser(req: Request, res: Response): Promise<Response> {
		try {
			const id = Number(req.params.id) || req.user.id

			if (req.user.role !== 'admin' && id !== req.user.id) {
				return res.status(403).json({ message: 'Acesso negado' })
			}

			const user = await userRepository.findById(id)
			if (!user) {
				return res.status(404).json({ message: 'Usuário não encontrado' })
			}

			const { name, username, email} = req.body

			if (email && email !== user.email) {
				if (!verifyEmail(email)) {
					return res.status(400).json({ message: 'Formato de email inválido' })
				}

				const emailExists = await userRepository.findByEmail(email)
				if (emailExists && emailExists.id !== user.id) {
					return res.status(409).json({ message: 'Email já está em uso' })
				}
			}

			if (username && username !== user.username) {
				if (!verifyUsername(username)) {
					return res.status(400).json({
						message:
							'Nome de usuário inválido. Use apenas letras, números, ponto e underline'
					})
				}

				const usernameExists = await userRepository.findByUsername(username)
				if (usernameExists && usernameExists.id !== user.id) {
					return res.status(409).json({ message: 'Nome de usuário já está em uso' })
				}
			}


			if (name) user.name = name
			if (email) user.email = email
			if (username) user.username = username

			const updatedUser = await userRepository.saveUser(user)

			return res.json(updatedUser)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async deleteUser(req: Request, res: Response): Promise<Response> {
		try {
			const id = Number(req.params.id) || req.user.id

			if (req.user.role !== 'admin' && id !== req.user.id) {
				return res.status(403).json({ message: 'Acesso negado' })
			}

			const user = await userRepository.findById(id)
			if (!user) {
				return res.status(404).json({ message: 'Usuário não encontrado' })
			}

			await userRepository.removeUser(user)

			return res.status(204).send()
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async changePassword(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user.id
			const { currentPassword, newPassword } = req.body
	
			if (!currentPassword || !newPassword) {
				return res.status(400).json({
					message: 'Senha atual e nova senha são obrigatórias'
				})
			}
	
			if (!verifyPassword(newPassword)) {
				return res.status(400).json({
					message: 'Senha fraca (Minímo 6 caracteres - 1 maiúsculo - 1 minúsculo - 1 número - 1 caractere especial)'
				})
			}
	
			const user = await userRepository.findById(userId)
			if (!user) {
				return res.status(404).json({ message: 'Usuário não encontrado' })
			}
	
			const passwordMatch = await bcrypt.compare(
				currentPassword,
				user.password
			)
	
			if (!passwordMatch) {
				return res.status(401).json({
					message: 'Senha atual incorreta'
				})
			}
	
			user.password = newPassword
	
			await userRepository.saveUser(user)
	
			return res.status(200).json({
				message: 'Senha alterada com sucesso'
			})
	
		} catch (error) {
			console.error(error)
			return res.status(500).json({
				message: 'Erro interno do servidor'
			})
		}
	}
}



