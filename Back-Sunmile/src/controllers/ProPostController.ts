import { Request, Response } from 'express'
import { ProPostRepository } from '../repositories/ProPostRepository'
import { ProfessionalRepository } from '../repositories/ProfessionalRepository'

const proPostRepository = new ProPostRepository()
const professionalRepository = new ProfessionalRepository()

export class ProPostController {

	async list(req: Request, res: Response) {
		try {
			const posts = await proPostRepository.findAllWithProfessional()
			return res.json(posts)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async show(req: Request, res: Response) {
		try {
			const { id } = req.params

			const post = await proPostRepository.findByIdWithProfessional(Number(id))
			if (!post) {
				return res.status(404).json({ message: 'Post profissional não encontrado' })
			}

			return res.json(post)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async create(req: Request, res: Response) {
		try {
			const { title, content, image_urls } = req.body
			const userId = req.user.id
		
			if (!title || !content) {
				return res.status(400).json({
				message: 'Título e conteúdo são obrigatórios'
				})
			}
		
			if (image_urls && !Array.isArray(image_urls)) {
				return res.status(400).json({
				message: 'image_urls deve ser um array'
				})
			}
		
			const professional = await professionalRepository.findByUserId(userId)
		
			if (!professional) {
				return res.status(403).json({
				message: 'Apenas profissionais podem criar posts'
				})
			}
		
			const post = await proPostRepository.createAndSave({
				title,
				content,
				image_urls: image_urls ?? [],
				professional
			})
		
			return res.status(201).json(post)
			} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}
	  

	async update(req: Request, res: Response) {
		try {
			const { id } = req.params
			const { title, content, image_urls } = req.body
			const user = req.user

			const post = await proPostRepository.findByIdWithProfessional(Number(id))
			if (!post) {
			return res.status(404).json({ message: 'Post profissional não encontrado' })
			}

			const isOwner = post.professional.user.id === user.id

			if (user.role !== 'admin' && !isOwner) {
			return res.status(403).json({ message: 'Acesso negado' })
			}

			if (title !== undefined) post.title = title
			if (content !== undefined) post.content = content
			if (image_urls !== undefined) {
			if (!Array.isArray(image_urls)) {
				return res.status(400).json({ message: 'image_urls deve ser um array' })
			}
			post.image_urls = image_urls
			}

			const updatedPost = await proPostRepository.save(post)
			return res.json(updatedPost)
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const { id } = req.params
			const user = req.user

			const post = await proPostRepository.findByIdWithProfessional(Number(id))
			if (!post) {
				return res.status(404).json({ message: 'Post profissional não encontrado' })
			}

			const isOwner = post.professional.user.id === user.id

			if (user.role !== 'admin' && !isOwner) {
				return res.status(403).json({ message: 'Acesso negado' })
			}

			await proPostRepository.remove(post)
			return res.status(204).send()
		} catch (error) {
			console.error(error)
			return res.status(500).json({ message: 'Erro interno do servidor' })
		}
	}
}
