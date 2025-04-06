import React, { use, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Repo {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
}

interface DailyCommit {
  date: string;
  count: number;
}

function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

const App = () => {
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [dailyCommits, setDailyCommits] = useState<DailyCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [noUser , setNoUser] = useState(false);

  const fetchGitHubData = async () => {
    try {
      setLoading(true);
      setRepos([]);
      const repoRes = await fetch(
        `https://api.github.com/users/${username}/repos`
      );
      const repoData = await repoRes.json();
      if(repoData.message == "Not Found"){ setNoUser(true)}
      else {
        setRepos(repoData);
        setNoUser(false);
      }

      const eventsRes = await fetch(
        `https://api.github.com/users/${username}/events/public`
      );
      const events = await eventsRes.json();

      const commitMap: Record<string, number> = {};
      events.forEach((event: any) => {
        if (event.type === "PushEvent") {
          const date = new Date(event.created_at).toISOString().split("T")[0];
          const commits = event.payload.commits?.length || 0;
          commitMap[date] = (commitMap[date] || 0) + commits;
        }
      });

      const lastDates = getLastNDates(14);
      const filledCommits: DailyCommit[] = lastDates.map((date) => ({
        date,
        count: commitMap[date] || 0,
      }));

      setDailyCommits(filledCommits);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto flex flex-col items-center gap-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
        User Profile Analyzer
      </h1>

      <div className="w-full flex flex-col sm:flex-row justify-center gap-4 sm:gap-3">
        <Input
          className="h-10 sm:w-64 w-full border-gray-500"
          placeholder="Enter GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button
          className="h-10 sm:w-32 w-full hover:bg-gray-600"
          onClick={fetchGitHubData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Analyze"}
        </Button>
      </div>

      {repos.length > 0 && (
        <div className="w-full border-2 border-gray-300 shadow-2xl rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">
            Repositories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <Card key={repo.name} className="shadow-2xl hover:scale-95 transition-all duration-500 ease-in-out p-4 border-[3px] border-gray-300">
                <CardContent className="">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lg sm:text-xl font-bold text-blue-600 hover:tracking-wider transition-all duration-300 ease-linear hover:underline"
                  >
                    {repo.name}
                  </a>
                  <p className="text-sm sm:text-base text-gray-700 tracking-tighter py-2">{repo.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    ⭐ {repo.stargazers_count} | 🍴 {repo.forks_count}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {
        noUser && (
          <div className="w-full border-2 border-gray-300 shadow-2xl rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-red-600">
            No User Found!
          </h2>
          </div>
        )
      }

      {dailyCommits.length > 0 && !noUser && (
        <div className="w-full border-2 border-gray-300 shadow-2xl rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
            Daily Commit Activity (Last 14 Days)
          </h2>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCommits}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
