/* =============================
   SETTINGS MENU + THEME
============================= */

const settingsButton = document.querySelector('.settings')
const settingsMenu = document.querySelector('.settings-menu')
const darkToggle = document.querySelector('#darkModeToggle')

settingsButton?.addEventListener('click', (e) => {
	e.stopPropagation()
	settingsMenu.classList.toggle('active')

	if (!settingsMenu.classList.contains('active')) return

	const rect = settingsButton.getBoundingClientRect()
	const padding = 8

	let left = rect.right + padding
	let top = rect.top

	if (left + settingsMenu.offsetWidth > window.innerWidth) {
		left = rect.left - settingsMenu.offsetWidth - padding
	}

	if (top + settingsMenu.offsetHeight > window.innerHeight) {
		top = window.innerHeight - settingsMenu.offsetHeight - padding
	}

	settingsMenu.style.left = `${left}px`
	settingsMenu.style.top = `${top}px`
})

document.addEventListener('click', (e) => {
	if (!settingsMenu?.contains(e.target) && !settingsButton?.contains(e.target)) {
		settingsMenu?.classList.remove('active')
	}
})

darkToggle?.addEventListener('change', () => {
	document.body.classList.toggle('dark-theme', darkToggle.checked)
	localStorage.setItem('darkMode', darkToggle.checked ? '1' : '0')
})

if (localStorage.getItem('darkMode') === '1') {
	document.body.classList.add('dark-theme')
	if (darkToggle) darkToggle.checked = true
}

/* =============================
   GLOBAL CONFIG
============================= */

const API_BASE = 'https://sunmile-back.vercel.app/sunmile'
const token = localStorage.getItem('token')

const pageContainer = document.getElementById('page-container')
const links = document.querySelectorAll('.menu a')

/* =============================
   CURRENT USER
============================= */

async function fetchCurrentUser() {
	try {
		const res = await fetch(`${API_BASE}/me/user`, {
			headers: { Authorization: `Bearer ${token}` }
		})
		if (!res.ok) throw new Error()
		return await res.json()
	} catch {
		return null
	}
}

async function fetchCurrentProfessional() {
	try {
		const res = await fetch(`${API_BASE}/me/pro`, {
			headers: { Authorization: `Bearer ${token}` }
		})
		if (!res.ok) return null
		return await res.json()
	} catch {
		return null
	}
}

/* =============================
   SPA NAVIGATION
============================= */

async function loadPage(page) {
	try {
		if (page === 'posts') {
			const res = await fetch('../pages/pro-post.html')
			pageContainer.innerHTML = await res.text()

			await toggleCreatePostButton()
			loadPosts()
			setupPostModal()
			return
		}

		if (page === 'professionals') {
			const res = await fetch('../pages/professionals.html')
			pageContainer.innerHTML = await res.text()
			loadProfessionals()
			return
		}

		if (page === 'account') {
			const user = await fetchCurrentUser()
			if (!user) return

			if (user.role === 'pro') {
				const professional = await fetchCurrentProfessional()
				if (professional) user.professional = professional
			}

			const profilePage = user.role === 'pro'
				? 'account-pro'
				: 'account-user'

			const res = await fetch(`../pages/${profilePage}.html`)
			pageContainer.innerHTML = await res.text()

			loadProfile(user)
			return
		}

		const res = await fetch(`../pages/${page}.html`)
		pageContainer.innerHTML = await res.text()

	} catch (err) {
		console.error(err)
		pageContainer.innerHTML = '<p>Erro ao carregar página.</p>'
	}
}

links.forEach(link => {
	link.addEventListener('click', (e) => {
		e.preventDefault()
		loadPage(link.dataset.page)
	})
})

/* =============================
   POSTS
============================= */

async function toggleCreatePostButton() {
	const btn = document.getElementById('create-post-btn')
	if (!btn) return

	const user = await fetchCurrentUser()
	btn.style.display = user?.role === 'pro' ? 'inline-block' : 'none'
}

async function loadPosts() {
	const container = document.getElementById('posts-list')
	if (!container) return

	container.innerHTML = '<p>Carregando posts...</p>'

	try {
		const res = await fetch(`${API_BASE}/pro-posts`)
		if (!res.ok) throw new Error()

		const posts = await res.json()

		container.innerHTML = posts.map(post => {
			const user = post.professional.user

			const avatar = user.profile_pic_url
				? `<img src="${user.profile_pic_url}" alt="Avatar de ${user.name}">`
				: user.name.charAt(0)

			const images = Array.isArray(post.image_urls)
				? `
					<div class="post-images">
						${post.image_urls.map(url => `
							<img src="${url}" alt="Imagem do post">
						`).join('')}
					</div>
				  `
				: ''

			return `
				<div class="post-card">
					<div class="post-header">
						<div class="post-avatar">${avatar}</div>
						<div class="post-author">
							<strong>${user.name}</strong>
							<span>@${user.username}</span>
						</div>
					</div>

					<div class="post-content">
						<h3>${post.title}</h3>
						<p>${post.content}</p>
						${images}
					</div>
				</div>
			`
		}).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar posts.</p>'
	}
}

/* =============================
   CREATE POST MODAL
============================= */

function setupPostModal() {
	const modal = document.getElementById('post-modal')
	const openBtn = document.getElementById('create-post-btn')
	const cancelBtn = document.getElementById('cancel-post')
	const submitBtn = document.getElementById('submit-post')
	const imageInput = document.getElementById('post-images')
	const preview = document.getElementById('post-image-preview')

	if (!modal || !openBtn || !cancelBtn || !submitBtn) return

	let selectedFiles = []

	openBtn.onclick = () => modal.classList.remove('hidden')

	cancelBtn.onclick = () => {
		modal.classList.add('hidden')
		preview.innerHTML = ''
		imageInput.value = ''
		selectedFiles = []
	}

	imageInput.onchange = () => {
		preview.innerHTML = ''
		selectedFiles = Array.from(imageInput.files)

		selectedFiles.forEach(file => {
			if (!file.type.startsWith('image/')) return

			const reader = new FileReader()
			reader.onload = () => {
				const img = document.createElement('img')
				img.src = reader.result
				preview.appendChild(img)
			}
			reader.readAsDataURL(file)
		})
	}

	submitBtn.onclick = async () => {
		const title = document.getElementById('post-title').value.trim()
		const content = document.getElementById('post-content').value.trim()

		if (!title || !content) {
			alert('Preencha todos os campos')
			return
		}

		try {
			let image_urls = []

			for (const file of selectedFiles) {
				const formData = new FormData()
				formData.append('file', file)
				formData.append('upload_preset', 'sunmile_unsigned')

				const cloudRes = await fetch(
					'https://api.cloudinary.com/v1_1/dgvwjb1cj/image/upload',
					{ method: 'POST', body: formData }
				)

				const cloudData = await cloudRes.json()
				if (cloudData.secure_url) {
					image_urls.push(cloudData.secure_url)
				}
			}

			const res = await fetch(`${API_BASE}/pro-posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ title, content, image_urls })
			})

			if (!res.ok) throw new Error()

			modal.classList.add('hidden')
			preview.innerHTML = ''
			imageInput.value = ''
			selectedFiles = []

			loadPosts()

		} catch {
			alert('Erro ao criar post')
		}
	}
}

/* =============================
   PROFESSIONALS
============================= */

let professionalsCache = []

async function loadProfessionals() {
	const container = document.getElementById('professionals-list')
	if (!container) return

	container.innerHTML = '<p>Carregando profissionais...</p>'

	try {
		const res = await fetch(`${API_BASE}/professionals`)
		if (!res.ok) throw new Error()

		const professionals = await res.json()
		professionalsCache = professionals

		container.innerHTML = professionals.map((pro, index) => `
			<div class="professional-card">
				<div class="professional-header">
					<div class="professional-avatar">
						${
							pro.user.profile_pic_url
								? `<img src="${pro.user.profile_pic_url}" alt="Avatar de ${pro.user.name}">`
								: pro.user.name.charAt(0)
						}
					</div> 
					<div class="professional-name">
						<strong>${pro.user.name}</strong>
						<span>@${pro.user.username}</span>
					</div>
				</div>

				<div class="professional-info">
					<p><strong>Registro:</strong> ${pro.pro_registration}</p>
					<p><strong>Telefone:</strong> ${pro.phone_number}</p>

					${
						pro.bio
							? `
								<p class="professional-bio">${pro.bio}</p>
								<button
									class="show-more-btn"
									onclick="openProfessionalModal(${index})">
									Exibir mais
								</button>
							`
							: ''
					}
				</div>
			</div>
		`).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar profissionais.</p>'
	}
}

function openProfessionalModal(index) {
	const pro = professionalsCache[index]
	const modal = document.getElementById('professional-modal')

	const avatar = document.getElementById('modal-avatar')
	avatar.innerHTML = pro.user.profile_pic_url
		? `<img src="${pro.user.profile_pic_url}" alt="Avatar de ${pro.user.name}">`
		: pro.user.name.charAt(0)

	document.getElementById('modal-name').textContent = pro.user.name
	document.getElementById('modal-username').textContent = '@' + pro.user.username
	document.getElementById('modal-registration').textContent = pro.pro_registration
	document.getElementById('modal-phone').textContent = pro.phone_number
	document.getElementById('modal-bio').textContent = pro.bio || ''

	modal.classList.remove('hidden')
}

window.openProfessionalModal = openProfessionalModal
window.closeProfessionalModal = closeProfessionalModal


function closeProfessionalModal() {
	document.getElementById('professional-modal').classList.add('hidden')
}

async function updateProfileAvatar(imageUrl) {
	const res = await fetch(`${API_BASE}/users/me/avatar`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ profile_pic_url: imageUrl })
	})

	if (!res.ok) {
		throw new Error('Erro ao salvar avatar')
	}
}
  
/* =============================
   PROFILE (UPDATE / DELETE)
============================= */

function loadProfile(user) {
	const form = document.getElementById('perfil-form')
	const status = document.getElementById('status')
	const deleteBtn = document.getElementById('delete-account-btn')
	const avatarImg = document.getElementById('profile-avatar')
	const avatarInput = document.getElementById('avatar-input')

	if (avatarImg) {
	avatarImg.src = user.profile_pic_url
		? user.profile_pic_url
		: '../assets/img/default avatar.jpg'
	}

	if (!form) return

	form.name.value = user.name || ''
	form.username.value = user.username || ''
	form.email.value = user.email || ''

	if (form.cpf) form.cpf.value = user.cpf || ''
	if (form.birth_date) {
		form.birth_date.value = user.birth_date?.split('T')[0] || ''
	}

	if (user.professional) {
		form.phone_number.value = user.professional.phone_number || ''
		form.bio.value = user.professional.bio || ''
		form.pro_registration.value = user.professional.pro_registration || ''
	}

	avatarImg?.addEventListener('click', () => {
		avatarInput.click()
	})

	avatarInput?.addEventListener('change', async () => {
		const file = avatarInput.files[0]
		if (!file) return
	  
		if (!file.type.startsWith('image/')) {
		  alert('Selecione uma imagem válida')
		  return
		}
	  
		const formData = new FormData()
		formData.append('file', file)
		formData.append('upload_preset', 'sunmile_unsigned')
	  
		try {
		  avatarImg.style.opacity = '0.5'
	  
		  const cloudRes = await fetch(
			'https://api.cloudinary.com/v1_1/dgvwjb1cj/image/upload',
			{
			  method: 'POST',
			  body: formData
			}
		  )
	  
		  const cloudData = await cloudRes.json()
		  if (!cloudData.secure_url) throw new Error()
	  
		  avatarImg.src = cloudData.secure_url
	  
		  await updateProfileAvatar(cloudData.secure_url)
	  
		} catch {
		  alert('Erro ao enviar imagem')
		} finally {
		  avatarImg.style.opacity = '1'
		}
	})
	  

	form.addEventListener('submit', async (e) => {
		e.preventDefault()

		status.textContent = 'Salvando...'
		status.style.color = '#666'

		const body = {
			name: form.name.value,
			username: form.username.value,
			email: form.email.value
		}

		let endpoint = `${API_BASE}/users/${user.id}`

		if (user.role === 'pro') {
			endpoint = `${API_BASE}/pro/${user.professional.id}`
			body.phone_number = form.phone_number.value
			body.bio = form.bio.value
		}

		try {
			const res = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(body)
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message)

			status.textContent = 'Perfil atualizado com sucesso!'
			status.style.color = 'green'
		} catch (err) {
			status.textContent = err.message
			status.style.color = 'red'
		}
	})

	deleteBtn?.addEventListener('click', async (e) => {
		e.preventDefault()

		if (!confirm('Deseja realmente deletar sua conta?')) return

		await fetch(`${API_BASE}/users/${user.id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		})

		localStorage.removeItem('token')
		window.location.href = '../index.html'
	})

	setupPasswordModal()
}

/* =============================
   PASSWORD MODAL
============================= */

function setupPasswordModal() {
	const openBtn = document.getElementById('btn-password')
	const modal = document.getElementById('password-modal')
	const cancelBtn = document.getElementById('cancel-password')
	const form = document.getElementById('password-form')
	const status = document.getElementById('password-status')

	if (!openBtn || !modal || !cancelBtn || !form) return

	openBtn.onclick = () => {
		modal.classList.remove('hidden')
		form.reset()
		status.textContent = ''
	}

	cancelBtn.onclick = () => modal.classList.add('hidden')

	form.onsubmit = async (e) => {
		e.preventDefault()

		const currentPassword = document.getElementById('current-password').value
		const newPassword = document.getElementById('new-password').value

		status.textContent = 'Atualizando senha...'
		status.style.color = '#666'

		try {
			const res = await fetch(`${API_BASE}/users/change-password`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ currentPassword, newPassword })
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message)

			status.textContent = 'Senha alterada com sucesso!'
			status.style.color = 'green'

			setTimeout(() => {
				localStorage.removeItem('token')
				window.location.href = '../index.html'
			}, 1500)
		} catch (err) {
			status.textContent = err.message
			status.style.color = 'red'
		}
	}
}

/* =============================
   LOGOUT
============================= */

document.querySelector('.logout-btn')?.addEventListener('click', () => {
	localStorage.removeItem('token')
	window.location.href = '../index.html'
})
