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
				const res = await fetch('../pages/account-pro.html')
				pageContainer.innerHTML = await res.text()
				loadProfessionalProfile(user, professional)
			} else {
				const res = await fetch('../pages/account-user.html')
				pageContainer.innerHTML = await res.text()
				loadUserProfile(user)
			}
			return
		}

		const res = await fetch(`../pages/${page}.html`)
		pageContainer.innerHTML = await res.text()

	} catch {
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

	container.innerHTML = '<p>Carregando profissionais...</p>'

	try {
		const res = await fetch(`${API_BASE}/professionals`)
		if (!res.ok) throw new Error()

		const professionals = await res.json()

		container.innerHTML = professionals.map(pro => `
			<div class="professional-card">
				<strong>${pro.user.name}</strong>
				<p>@${pro.user.username}</p>
				<p><b>Registro:</b> ${pro.pro_registration}</p>
				<p><b>Telefone:</b> ${pro.phone_number}</p>
				${pro.bio ? `<p><b>Bio:</b> ${pro.bio}</p>` : ''}
			</div>
		`).join('')
	} catch {
		container.innerHTML = '<p>Erro ao carregar profissionais.</p>'
	}
}

/* =============================
   USER PROFILE
============================= */

function loadUserProfile(user) {
	const form = document.getElementById('perfil-form')
	const status = document.getElementById('status')

	form.name.value = user.name
	form.username.value = user.username
	form.email.value = user.email
	form.cpf.value = user.cpf
	form.birth_date.value = user.birth_date.split('T')[0]

	form.onsubmit = async (e) => {
		e.preventDefault()

		try {
			const res = await fetch(`${API_BASE}/users/${user.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name: form.name.value,
					username: form.username.value,
					email: form.email.value
				})
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message)

			status.textContent = 'Perfil atualizado!'
			status.style.color = 'green'
		} catch (err) {
			status.textContent = err.message
			status.style.color = 'red'
		}
	}

	setupPasswordModal()
}

/* =============================
   PROFESSIONAL PROFILE
============================= */

function loadProfessionalProfile(user, professional) {
	const form = document.getElementById('perfil-form')
	const status = document.getElementById('status')

	form.name.value = user.name
	form.username.value = user.username
	form.email.value = user.email
	form.cpf.value = user.cpf
	form.birth_date.value = user.birth_date.split('T')[0]

	form.phone_number.value = professional.phone_number
	form.bio.value = professional.bio || ''
	form.pro_registration.value = professional.pro_registration

	form.onsubmit = async (e) => {
		e.preventDefault()

		try {
			const res = await fetch(`${API_BASE}/pro/${professional.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					phone_number: form.phone_number.value,
					bio: form.bio.value
				})
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message)

			status.textContent = 'Perfil profissional atualizado!'
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

	if (!openBtn) return

	openBtn.onclick = () => modal.classList.remove('hidden')
	cancelBtn.onclick = () => modal.classList.add('hidden')

	form.onsubmit = async (e) => {
		e.preventDefault()

		try {
			const res = await fetch(`${API_BASE}/users/change-password`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					currentPassword: current-password.value,
					newPassword: new-password.value
				})
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message)

			status.textContent = 'Senha alterada!'
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
