/* =============================
   SETTINGS MENU + THEME
============================= */

const settingsButton = document.querySelector('.settings')
const settingsMenu = document.querySelector('.settings-menu')
const darkToggle = document.querySelector('#darkModeToggle')

settingsButton?.addEventListener('click', (e) => {
	e.stopPropagation()
	settingsMenu.classList.toggle('active')
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
		if (page === 'account') {
			const user = await fetchCurrentUser()
			if (!user) return

			const pageName = user.role === 'pro'
				? 'account-pro'
				: 'account-user'

			const res = await fetch(`../pages/${pageName}.html`)
			pageContainer.innerHTML = await res.text()

			let professional = null
			if (user.role === 'pro') {
				professional = await fetchCurrentProfessional()
			}

			loadProfile(user, professional)
			return
		}

		const res = await fetch(`../pages/${page}.html`)
		pageContainer.innerHTML = await res.text()

		if (page === 'professionals') loadProfessionals()
		if (page === 'posts') loadPosts()

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
   PROFESSIONALS LIST
============================= */

async function loadProfessionals() {
	const container = document.getElementById('professionals-list')
	if (!container) return

	container.innerHTML = '<p>Carregando...</p>'

	try {
		const res = await fetch(`${API_BASE}/professionals`)
		const professionals = await res.json()

		container.innerHTML = professionals.map(pro => `
			<div class="professional-card">
				<strong>${pro.user.name}</strong>
				<p>${pro.pro_registration}</p>
				<p>${pro.phone_number}</p>
				${pro.bio ? `<p>${pro.bio}</p>` : ''}
			</div>
		`).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar profissionais</p>'
	}
}

/* =============================
   PROFILE
============================= */

function loadProfile(user, professional) {
	const form = document.getElementById('perfil-form')
	const status = document.getElementById('status')

	if (!form) return

	form.name.value = user.name
	form.username.value = user.username
	form.email.value = user.email

	if (form.cpf) form.cpf.value = user.cpf
	if (form.birth_date) {
		form.birth_date.value = user.birth_date?.split('T')[0]
	}

	if (professional) {
		form.phone_number.value = professional.phone_number || ''
		form.bio.value = professional.bio || ''
		form.pro_registration.value = professional.pro_registration || ''
	}

	form.onsubmit = async (e) => {
		e.preventDefault()

		status.textContent = 'Salvando...'
		status.style.color = '#666'

		let endpoint = `${API_BASE}/users/${user.id}`
		const body = {
			name: form.name.value,
			username: form.username.value,
			email: form.email.value
		}

		if (professional) {
			endpoint = `${API_BASE}/pro/${professional.id}`
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

			status.textContent = 'Atualizado com sucesso!'
			status.style.color = 'green'

		} catch (err) {
			status.textContent = err.message
			status.style.color = 'red'
		}
	}

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
				window.location.href = '../pages/index.html'
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
	window.location.href = '../pages/index.html'
})
