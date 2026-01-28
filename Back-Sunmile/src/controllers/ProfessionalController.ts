import { Request, Response } from 'express'
import { ProfessionalRepository } from '../repositories/ProfessionalRepository'
import { UserRepository } from '../repositories/UserRepository'
import {
	verifyBirthDate,
	verifyPassword,
	verifyCPF,
	verifyUsername,
	verifyPhone,
	verifyEmail
} from '../helpers/helpers'

const professionalRepository = new ProfessionalRepository()
const userRepository = new UserRepository()

export class ProfessionalController {
	async list(req: Request, res: Response) {
		try {
			const professionals = await professionalRepository.findAllWithUser()
			return res.json(professionals)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async createProfessional(req: Request, res: Response): Promise<Response> {
		try {
			const {
				name,
				username,
				email,
				cpf,
				phone_number,
				birth_date,
				password,
				bio,
				pro_registration
			} = req.body

			if (
				!name ||
				!username ||
				!email ||
				!cpf ||
				!phone_number ||
				!birth_date ||
				!password ||
				!pro_registration
			) {
				return res.status(400).json({ message: 'Informações obrigatórias não preenchidas' })
			}

			const userExists = await userRepository.findByEmail(email)
			const usernameExists = await userRepository.findByUsername(username)
			const cpfExists = await userRepository.findByCPF(cpf)
			const phoneExists = await professionalRepository.findByPhone(phone_number)
			const registrationExists = await professionalRepository.findByRegistration(pro_registration)
			const birthDateValid = verifyBirthDate(birth_date)
			const passwordValid = verifyPassword(password)
			const cpfValid = verifyCPF(cpf)
			const usernameValid = verifyUsername(username)
			const phoneValid = verifyPhone(phone_number)
			const emailValid = verifyEmail(email)

			if (userExists) return res.status(409).json({ message: 'Email já está em uso' })
			if (usernameExists) return res.status(409).json({ message: 'Nome de usuário já está em uso' })
			if (cpfExists) return res.status(409).json({ message: 'CPF já cadastrado'})
			if (phoneExists) return res.status(409).json({ message: 'Número de telefone já está em uso' })
			if (registrationExists) return res.status(409).json({ message: 'Registro profissional já está em uso' })
			if (!birthDateValid) return res.status(409).json({ message: 'Data de nascimento inválida ou idade não permitida' })
			if (!passwordValid) return res.status(409).json({ message: 'Senha fraca. Utilize um padrão mais seguro' })
			if (!cpfValid) return res.status(409).json({ message: 'CPF inválido' })
			if (!usernameValid) {
				return res.status(409).json({
					message: 'Nome de usuário inválido. Use apenas letras, números, ponto e underline'
				})
			}
			if (!phoneValid) {
				return res
					.status(409)
					.json({ message: 'Número de telefone inválido. Exemplo: (11) 99999-9999' })
			}
			if (!emailValid) return res.status(409).json({ message: 'Email inválido' })

			const user = await userRepository.createAndSave({
				name,
				username,
				email,
				cpf,
				birth_date,
				password,
				role: 'pro'
			})

			const professional = await professionalRepository.createAndSave({
				bio,
				phone_number,
				pro_registration,
				user
			})

			return res.status(201).json(professional)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async updateProfessional(req: Request, res: Response): Promise<Response> {
		try {
			const id = Number(req.params.id) || req.user.id

			if (req.user.role !== 'admin' && id !== req.user.id) {
				return res.status(403).json({ message: 'Acesso negado' })
			}

			const professional = await professionalRepository.findByUserId(id)
			if (!professional) {
				return res.status(404).json({ message: 'Profissional não encontrado' })
			}

			const { name, username, email, bio, phone_number } = req.body

			if (email && email !== professional.user.email) {
				if (!verifyEmail(email)) {
					return res.status(400).json({ message: 'Formato de email inválido' })
				}

				const emailExists = await userRepository.findByEmail(email)
				if (emailExists && emailExists.id !== professional.user.id) {
					return res.status(409).json({ message: 'Email já está em uso' })
				}
			}

			if (username && username !== professional.user.username) {
				if (!verifyUsername(username)) {
					return res.status(400).json({ message: 'Formato de nome de usuário inválido' })
				}

				const usernameExists = await userRepository.findByUsername(username)
				if (usernameExists && usernameExists.id !== professional.user.id) {
					return res.status(409).json({ message: 'Nome de usuário já está em uso' })
				}
			}

			if (phone_number && phone_number !== professional.phone_number) {
				if (!verifyPhone(phone_number)) {
					return res
						.status(400)
						.json({ message: 'Formato de telefone inválido. Use (11) 99999-9999' })
				}

				const phoneExists = await professionalRepository.findByPhone(phone_number)
				if (phoneExists && phoneExists.id !== professional.id) {
					return res.status(409).json({ message: 'Número de telefone já está em uso' })
				}
			}

			if (name) professional.user.name = name
			if (email) professional.user.email = email
			if (username) professional.user.username = username
			if (bio) professional.bio = bio
			if (phone_number) professional.phone_number = phone_number

			await userRepository.saveUser(professional.user)
			const updatedProfessional = await professionalRepository.savePro(professional)

			return res.json(updatedProfessional)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async deleteProfessional(req: Request, res: Response): Promise<Response> {
		try {
			const id = Number(req.params.id) || req.user.id

			if (req.user.role !== 'admin' && id !== req.user.id) {
				return res.status(403).json({ message: 'Acesso negado' })
			}

			const professional = await professionalRepository.findById(id)
			if (!professional) {
				return res.status(404).json({ message: 'Profissional não encontrado' })
			}

			await professionalRepository.removePro(professional)
			await userRepository.removeUser(professional.user)

			return res.status(204).send()
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}
}
