import { useState } from "react"

function App() {
  const [page, setPage] = useState("home")
  const [selectedInterests, setSelectedInterests] = useState([])

  const interests = [
    { name: "Artificial Intelligence", icon: "🤖" },
    { name: "Technology", icon: "💻" },
    { name: "Space", icon: "🚀" },
    { name: "Science", icon: "🔬" },
    { name: "Gaming", icon: "🎮" },
    { name: "Finance", icon: "📈" },
  ]

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      )
    } else {
      setSelectedInterests([
        ...selectedInterests,
        interest
      ])
    }
  }
  const generateNews = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/generate-news",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interests: selectedInterests,
        }),
      }
    )

    const data = await response.json()

    console.log("Backend response:", data)

    setPage("dashboard")
  } catch (error) {
    console.error("Error connecting to backend:", error)
    alert("Could not connect to backend")
  }
}

  // HOME PAGE
  if (page === "home") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">

        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="text-2xl font-bold">
            MyNews-<span className="text-blue-400">AI</span>
          </div>

          <button className="border border-slate-700 px-5 py-2 rounded-full hover:bg-slate-800">
            Sign In
          </button>
        </nav>

        <main className="max-w-7xl mx-auto px-8">

          <section className="min-h-[80vh] flex flex-col items-center justify-center text-center">

            <div className="mb-6 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
              ✨ AI-Powered Personalized News
            </div>

            <h1 className="text-5xl md:text-7xl font-bold max-w-4xl leading-tight">
              Your news.
              <br />
              <span className="text-blue-400">
                Your interests.
              </span>
            </h1>

            <p className="mt-6 text-slate-400 text-lg max-w-2xl">
              Stop scrolling through endless headlines.
              Let AI find, understand and explain the stories
              that actually matter to you.
            </p>

            <button
              onClick={() => setPage("interests")}
              className="mt-10 px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold text-lg transition"
            >
              Get Started →
            </button>

          </section>

          <section className="grid md:grid-cols-3 gap-6 pb-20">

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">
                AI Powered
              </h3>
              <p className="text-slate-400">
                AI reads and summarizes the latest news for you.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">
                Personalized
              </h3>
              <p className="text-slate-400">
                Get stories based on your interests and preferences.
              </p>
            </div>
          </section>

        </main>
      </div>
    )
  }


  // INTEREST PAGE
  if (page === "interests") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">

        <nav className="px-8 py-6 max-w-7xl mx-auto">
          <button
            onClick={() => setPage("home")}
            className="text-slate-400 hover:text-white"
          >
            ← Back
          </button>
        </nav>

        <main className="max-w-4xl mx-auto px-8 py-12">

          <div className="text-center mb-12">

            <div className="text-blue-400 text-sm mb-4">
              STEP 1 OF 2
            </div>

            <h1 className="text-4xl md:text-5xl font-bold">
              What are you interested in?
            </h1>

            <p className="text-slate-400 mt-4">
              Choose the topics you want your AI agent to follow.
            </p>

          </div>


          <div className="grid md:grid-cols-2 gap-4">

            {interests.map((interest) => {

              const isSelected =
                selectedInterests.includes(interest.name)

              return (
                <button
                  key={interest.name}
                  onClick={() => toggleInterest(interest.name)}
                  className={`
                    p-6 rounded-2xl border text-left
                    transition-all duration-200
                    ${
                      isSelected
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-slate-800 bg-slate-900 hover:border-slate-600"
                    }
                  `}
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <span className="text-3xl">
                        {interest.icon}
                      </span>

                      <span className="font-semibold text-lg">
                        {interest.name}
                      </span>

                    </div>

                    {isSelected && (
                      <span className="text-blue-400 text-xl">
                        ✓
                      </span>
                    )}

                  </div>

                </button>
              )
            })}

          </div>


          <div className="mt-10 text-center">

            <p className="text-slate-500 text-sm mb-4">
              {selectedInterests.length} topics selected
            </p>

            <button
              disabled={selectedInterests.length === 0}
              onClick={generateNews}
              className="px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 font-semibold transition"
            >
              Generate My News →
            </button>

          </div>

        </main>

      </div>
    )
  }


  // TEMPORARY DASHBOARD
  if (page === "dashboard") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">

        <nav className="px-8 py-6 max-w-7xl mx-auto">
          <div className="text-2xl font-bold">
            MyNews-<span className="text-blue-400">AI</span>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-8 py-12">

          <div className="mb-10">

            <p className="text-blue-400 text-sm">
              YOUR PERSONALIZED BRIEFING
            </p>

            <h1 className="text-4xl font-bold mt-2">
              Good Morning 👋
            </h1>

            <p className="text-slate-400 mt-2">
              Based on your interests:{" "}
              {selectedInterests.join(" • ")}
            </p>

          </div>

          <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center">

            <div className="text-5xl mb-5">
              🤖
            </div>

            <h2 className="text-2xl font-bold">
              Your AI News Agent
            </h2>

            <p className="text-slate-400 mt-3">
              Your personalized news will appear here.
            </p>

          </div>

        </main>

      </div>
    )
  }
}

export default App