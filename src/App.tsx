import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/shared/Layout";
import Dashboard from "./components/teacher/Dashboard";
import QuizCreator from "./components/teacher/QuizCreator";
import QuizEditor from "./components/teacher/QuizEditor";
import QuizSubmissions from "./components/teacher/QuizSubmissions";
import NameEntry from "./components/student/NameEntry";
import QuizView from "./components/student/QuizView";
import Results from "./components/student/Results";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/create"
            element={
              <Layout>
                <QuizCreator />
              </Layout>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <Layout>
                <QuizEditor />
              </Layout>
            }
          />
          <Route
            path="/submissions/:id"
            element={
              <Layout>
                <QuizSubmissions />
              </Layout>
            }
          />
          <Route
            path="/quiz/:link"
            element={
              <Layout showHeader={false}>
                <NameEntry />
              </Layout>
            }
          />
          <Route
            path="/take/:link"
            element={
              <Layout showHeader={false}>
                <QuizView />
              </Layout>
            }
          />
          <Route
            path="/results/:link"
            element={
              <Layout showHeader={false}>
                <Results />
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
