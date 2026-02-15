import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from './shared/utils/api';
import { Loader2 } from 'lucide-react';
import './index.css';

// Shared Components
import Sidebar from './shared/components/Sidebar';
import DashboardTabs from './features/dashboard/DashboardTabs';

// Auth Feature
import Auth from './features/auth/AuthPage';

// Dashboard Feature
import TutorDashboard from './features/dashboard/TutorDashboard';
import StudentDashboard from './features/dashboard/StudentDashboard';

// Courses Feature
import CourseCatalog from './features/courses/CourseCatalog';
import CourseOverview from './features/courses/CourseOverview';
import LearningHub from './features/courses/LearningHub';

// Assessment Feature
import AssessmentHub from './features/assessment/AssessmentHub';
import ExerciseHub from './features/assessment/ExerciseHub';
import FinalExamView from './features/assessment/FinalExamView';
import QuizView from './features/assessment/QuizView';

// AI Tutor Feature
import MusaTutor from './features/ai-tutor/MusaTutor';
import MusaAIHub from './features/ai-tutor/MusaAIHub';

// Research Feature
import ResearchHub from './features/research/ResearchHub';

// Textbook Feature
import ElectronicTextbook from './features/textbook/ElectronicTextbook';

// Notebook Feature
import StudyNotebook from './features/notebook/StudyNotebook';
import RepositoryView from './features/notebook/RepositoryView';
import CodingIDE from './features/coding/CodingIDE';
import SettingsManager from './features/settings/SettingsManager';


const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student_dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Nexus Intelligence Data
  const [mastery, setMastery] = useState(0);
  const [gpaData, setGpaData] = useState({ gpa: '0.0', letter_grade: 'N/A', courses: [] });
  const [gradeHistory, setGradeHistory] = useState([]);
  const [gradeScale, setGradeScale] = useState({});
  const [modelStatus, setModelStatus] = useState({ loaded: false, loading: false });
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [notes, setNotes] = useState([]); // Array of note objects [{id, title, content}]

  // Dynamic Data
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [repository, setRepository] = useState({ materials: [], questions: [] });
  const [chatHistory, setChatHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [voiceSessionId, setVoiceSessionId] = useState(null);
  const [gradingBreakdown, setGradingBreakdown] = useState(null);
  const [streak, setStreak] = useState(0);
  const [activeLessonId, setActiveLessonId] = useState('py_loops_01');
  const [nextTopic, setNextTopic] = useState(null);
  const [ragStats, setRagStats] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (user.role === 'tutor') setActiveTab('tutor');

        // Fetch private data only if authenticated
        logActivity();
        fetchStreak();
        // Chain calls to ensure course ID is available
        fetchCourses().then((courseId) => {
          fetchIntelligence(courseId);
        });
        fetchFeaturedAndCategories();
        fetchModelStatus();
        fetchNotes();
      } catch (e) {
        console.error("Failed to parse saved user", e);
        handleLogout();
      } finally {
        setIsAuthLoading(false);
      }
    } else {
      setIsAuthLoading(false);
      // Fetch public metadata anyway if needed
      fetchFeaturedAndCategories();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agent: 'dashboard' })
      });
      if (res.ok) {
        const data = await res.json();
        // Simply accept and set data without processing
        setMastery(data.mastery);
        setGpaData(data.gpa);
        setGradeHistory(data.gpa?.courses || []);
        setGradeScale(data.scale);
        setGradingBreakdown(data.breakdown);
        setStreak(data.streak);
        setEnrolledCourses(data.enrolled_courses);
        setModelStatus(data.model_status);
        setNextTopic(data.next_topic);
        setRagStats(data.rag_stats);

        if (!selectedCourseId && data.enrolled_courses.length > 0) {
          setSelectedCourseId(data.enrolled_courses[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching agent data", err);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agent: 'storage', action: 'fetch', collection: 'notes' })
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.data || []);
      }
    } catch (err) { console.error("Error fetching notes", err); }
  };

  const handleSaveNotes = async (content, title = null) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agent: 'storage', action: 'save', collection: 'notes', id: title || 'draft', data: content })
      });
      fetchNotes();
    } catch (err) { console.error("Error saving notes", err); }
  };

  const fetchIntelligence = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (user.role === 'tutor') setActiveTab('tutor');

        // Fetch all consolidated data via Agent
        fetchDashboardData();
        fetchFeaturedAndCategories();
        fetchNotes();
      } catch (e) {
        console.error("Failed to parse saved user", e);
        handleLogout();
      } finally {
        setIsAuthLoading(false);
      }
    } else {
      setIsAuthLoading(false);
      fetchFeaturedAndCategories();
    }
  }, []);

  const fetchFeaturedAndCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agent: 'course', action: 'get_catalog' })
      });

      if (res.ok) {
        const data = await res.json();
        setFeaturedCourses(data.featured || []);
        setCategories(data.categories || []);
      }
    } catch (err) { console.error("Error fetching catalog meta", err); }
  };


  const fetchCourses = async (category = null, search = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const cat = category !== null ? category : activeCategory;
      const q = search !== null ? search : searchQuery;

      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agent: 'course',
          action: 'list_all',
          category: cat !== 'All' ? cat : null,
          search: q
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAllCourses(data.courses || []);
      }
    } catch (err) { console.error("Error fetching courses", err); }
  };

  const fetchCourseDetail = async (id) => {
    if (!id) return;
    setSelectedCourseDetail(null); // Clear old detail
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/courses/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourseDetail(data);
      }
    } catch (err) {
      console.error("Error fetching course detail", err);
    }
  };

  const fetchRepository = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !selectedCourseId) return;
      const response = await fetch(`${API_BASE}/api/courses/${selectedCourseId}/repository`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setRepository(data);
    } catch (err) { console.error("Error fetching repo", err); }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchRepository();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (isVoiceActive && !voiceSessionId) {
      const sid = `session-${Math.random().toString(36).substr(2, 9)}`;
      setVoiceSessionId(sid);
      fetchVoiceGreeting(sid);
    }
  }, [isVoiceActive]);

  const fetchVoiceGreeting = async (sid) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/voice/greeting?session_id=${sid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (err) { console.error("Error fetching voice greeting", err); }
  };

  const handleSendMessage = async (msgOverride = null, forceResearch = false) => {
    const textToSend = msgOverride || inputMessage;
    if (!textToSend.trim() || aiLoading) return;

    const userMsg = { role: 'user', text: textToSend };
    setChatHistory(prev => [...prev, userMsg]);
    if (!msgOverride) setInputMessage('');
    setAiLoading(true);

    try {
      let context = "";
      if (isResearchMode || forceResearch) {
        const token = localStorage.getItem('token');
        const researchRes = await fetch(`${API_BASE}/api/research/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: textToSend, max_results: 3 })
        });
        if (researchRes.ok) {
          const researchData = await researchRes.json();
          // The new backend returns 'results' array
          if (researchData.results && researchData.results.length > 0) {
            context = `Research Findings: ${researchData.results[0].content_clean.substring(0, 500)}...\n\n`;
          }
        }
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const endpoint = isVoiceActive ? `${API_BASE}/api/voice/chat` : `${API_BASE}/api/ai/chat`;
      const body = isVoiceActive
        ? { text: textToSend, session_id: String(voiceSessionId) }
        : {
          message: context + textToSend,
          course_id: String(selectedCourseId),
          session_id: String(voiceSessionId || 'default-session')
        };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      // Handle the new response structure
      const aiResponse = isVoiceActive ? data.text : (data.response || data.answer);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Musa is temporarily unreachable. Please check your connection." }]);
    } finally {
      setAiLoading(false);
    }
  };


  const generateQuiz = async () => {
    if (!selectedCourseId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/student/exam/${selectedCourseId}?count=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setGeneratedQuiz(data.exam);
      setActiveTab('quiz_view');
    } catch (err) { console.error(err); }
    finally { setAiLoading(false); }
  };

  const launchAssessment = async (assessmentId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessment/${assessmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load assessment");
      const data = await res.json();

      // data contains id, title, type, questions
      setGeneratedQuiz(data);
      setActiveTab('quiz_view');
    } catch (err) {
      console.error(err);
      alert("Failed to generate assessment. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const launchFinalExam = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessment/final-exam/${courseId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 403) {
        alert("You must complete all exercises before taking the Final Exam.");
        return;
      }

      if (!res.ok) throw new Error("Failed to load exam");
      const data = await res.json();
      setGeneratedQuiz(data);
      setActiveTab('quiz_view');
    } catch (err) {
      console.error(err);
      alert("Exam generation failed. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh courses and enrolled courses
        await fetchCourses();
        // If we are in overview, the course selected will now show as enrolled
      }
    } catch (err) {
      console.error("Enrollment failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setActiveTab('catalog');
  };

  if (isAuthLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}><Loader2 className="edu-spin" color="var(--edu-indigo)" size={48} /></div>;

  if (!currentUser) return <Auth onLogin={user => setCurrentUser(user)} />;

  const selectedCourse = selectedCourseDetail || allCourses.find(c => c.id === selectedCourseId);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex' }}>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mastery={mastery}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '2.5rem' }}>
        {activeTab === 'tutor' && <TutorDashboard />}
        {activeTab === 'assessments' && <AssessmentHub />}
        {activeTab === 'student_dashboard' && (
          <StudentDashboard
            currentUser={currentUser}
            gpaData={gpaData}
            gradeHistory={gradeHistory}
            gradeScale={gradeScale}
            modelStatus={modelStatus}
            mastery={mastery}
            courses={enrolledCourses}
            setActiveTab={setActiveTab}
            gradingBreakdown={gradingBreakdown}
            streak={streak}
            nextTopic={nextTopic}
          />
        )}
        {activeTab === 'exercises' && <ExerciseHub courses={enrolledCourses} onStartAssessment={launchAssessment} aiLoading={aiLoading} />}
        {activeTab === 'final_exam' && <FinalExamView courses={enrolledCourses} onStartExam={launchFinalExam} loading={aiLoading} />}
        {activeTab === 'musa_ai' && <MusaAIHub courses={enrolledCourses} />}
        {activeTab === 'research_hub' && (
          <ResearchHub
            isResearchMode={isResearchMode}
            setIsResearchMode={setIsResearchMode}
            handleSendMessage={handleSendMessage}
            chatHistory={chatHistory}
            aiLoading={aiLoading}
          />
        )}
        {activeTab === 'learning_hub' && (
          <LearningHub
            onOpenTextbook={(id) => { if (id) setSelectedCourseId(id); setActiveTab('electronic_textbook'); }}
            onOpenCodingLab={(id) => { if (id) setActiveLessonId(id); setActiveTab('coding_lab'); }}
            repository={repository}
            courses={enrolledCourses}
          />
        )}

        {activeTab === 'electronic_textbook' && (
          <ElectronicTextbook
            courseId={selectedCourseId}
            onBack={() => setActiveTab('learning_hub')}
            onProgressUpdate={fetchIntelligence}
          />
        )}

        {activeTab === 'coding_lab' && (
          <CodingIDE
            lessonId={activeLessonId}
            onBack={() => setActiveTab('learning_hub')}
          />
        )}

        {activeTab === 'catalog' && (
          <CourseCatalog
            currentUser={currentUser}
            courses={allCourses}
            featuredCourses={featuredCourses}
            categories={categories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              fetchCourses(cat, searchQuery);
            }}
            onSearch={(q) => {
              setSearchQuery(q);
              fetchCourses(activeCategory, q);
            }}
            onSelectCourse={(id) => {
              setSelectedCourseId(id);
              fetchCourseDetail(id);
              setActiveTab('overview');
            }}
            onEnroll={handleEnroll}
          />
        )}



        {['overview', 'repository', 'tutor_ai', 'quiz_view'].includes(activeTab) && (
          <div className="edu-animate-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <DashboardTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onBack={() => setActiveTab('catalog')}
            />

            <div style={{ flex: 1 }}>
              {activeTab === 'overview' && (
                <CourseOverview
                  course={selectedCourse}
                  gpaData={gpaData}
                  mastery={mastery}
                  onLaunchMSUAI={() => setActiveTab('tutor_ai')}
                  onEnroll={handleEnroll}
                />
              )}

              {activeTab === 'repository' && <RepositoryView repository={repository} />}

              {activeTab === 'tutor_ai' && (
                <MusaTutor
                  chatHistory={chatHistory}
                  aiLoading={aiLoading}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendMessage}
                  isResearchMode={isResearchMode}
                  setIsResearchMode={setIsResearchMode}
                  isVoiceActive={isVoiceActive}
                  setIsVoiceActive={setIsVoiceActive}
                  generateQuiz={generateQuiz}
                  courseId={selectedCourseId}
                  ragStats={ragStats}
                  fetchIntelligence={fetchIntelligence}
                />
              )}

              {activeTab === 'quiz_view' && (
                <QuizView
                  generatedQuiz={generatedQuiz}
                  onClose={() => setActiveTab('tutor_ai')}
                  onComplete={fetchIntelligence}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'notebook' && (
          <StudyNotebook
            notes={notes}
            setNotes={setNotes}
            onSave={handleSaveNotes}
            currentUser={currentUser}
            onBack={() => setActiveTab('student_dashboard')}
            enrolledCourses={enrolledCourses}
          />
        )}

        {activeTab === 'settings' && <SettingsManager currentUser={currentUser} />}
      </main>
    </div>
  );
};

export default App;
