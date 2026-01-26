import { Request, Response } from 'express'
import { UserRepository } from '../repositories/UserRepository'
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
			const birthDateValid = verifyBirthDate(birth_date)
			const passwordValid = verifyPassword(password)
			const cpfValid = verifyCPF(cpf)
			const usernameValid = verifyUsername(username)
			const emailValid = verifyEmail(email)

			if (userExists) return res.status(409).json({ message: 'Email já está em uso' })
			if (usernameExists) return res.status(409).json({ message: 'Nome de usuário já está em uso' })
			if (!birthDateValid) {
				return res.status(409).json({ message: 'Data de nascimento inválida ou idade não permitida' })
			}
			if (!passwordValid) {
				return res.status(409).json({ message: 'Senha fraca. Utilize um padrão mais seguro' })
			}
			if (!cpfValid) return res.status(409).json({ message: 'CPF inválido' })
			if (!usernameValid) {
				return res.status(409).json({
					message: 'Nome de usuário inválido. Use apenas letras, números, ponto e underline'
				})
			}
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
			
	catch (error) {
	  console.error('Erro completo ao criar usuário:', error)
	
	  return res.status(500).json({
	    message: error instanceof Error ? error.message : 'Erro desconhecido',
	    stack: error instanceof Error ? error.stack : ''
	  })
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

			const { name, username, email, password } = req.body

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

			if (password && !verifyPassword(password)) {
				return res.status(400).json({
					message: 'Senha fraca. Utilize um padrão mais seguro'
				})
			}

			if (name) user.name = name
			if (email) user.email = email
			if (username) user.username = username
			if (password) user.password = password

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
}


