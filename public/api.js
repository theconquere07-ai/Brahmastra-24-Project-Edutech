class ApiClient {
  constructor() {
    this.token = localStorage.getItem('lumen_token');
    this.user = JSON.parse(localStorage.getItem('lumen_user') || 'null');
  }

  setToken(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('lumen_token', token);
      localStorage.setItem('lumen_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lumen_token');
      localStorage.removeItem('lumen_user');
    }
  }

  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`/api${endpoint}`, config);
    if (!res.ok) {
      if (res.status === 401) {
        this.setToken(null, null);
        window.location.reload();
      }
      throw new Error(await res.text());
    }
    return res.json();
  }

  login(email, password) {
    return this.request('/auth/login', 'POST', { email, password }).then(data => {
      this.setToken(data.token, data.user);
      return data.user;
    });
  }

  logout() {
    this.setToken(null, null);
  }

  // Admin endpoints
  getAdminDashboard() { return this.request('/admin/dashboard'); }

  // Teacher endpoints
  getTeacherDashboard() { return this.request('/teacher/dashboard'); }
  getStudentDetails(studentId) { return this.request(`/teacher/students/${studentId}`); }

  // Student endpoints
  getStudentDashboard() { return this.request('/student/dashboard'); }
  getAssessment(id) { return this.request(`/assessments/${id}`); }
  submitAssessment(id, answers) { return this.request(`/assessments/${id}/submit`, 'POST', { answers }); }
  getGapReport(assessmentId) { return this.request(`/student/gap-report/${assessmentId}`); }
  getGapDetails(gapId) { return this.request(`/student/gap/${gapId}`); }
  startRecovery(gapId) { return this.request(`/student/path/${gapId}/start`, 'POST'); }
  generatePractice(pathId) { return this.request(`/practice/${pathId}/generate`, 'POST'); }
  submitPractice(sessionId, answers) { return this.request(`/practice/${sessionId}/submit`, 'POST', { answers }); }
}

window.API = new ApiClient();
