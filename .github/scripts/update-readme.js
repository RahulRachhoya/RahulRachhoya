#!/usr/bin/env node

/**
 * Dynamic README Generator Script
 * 
 * This script generates a dynamic GitHub profile README with:
 * - Auto-updating GitHub activity feed
 * - Markdown timestamp
 * - Dynamic repository statistics
 * - Auto-updating contribution graph
 * - WakaTime coding stats (if configured)
 */

const fs = require('fs');
const https = require('https');

const USERNAME = process.env.USERNAME || 'RahulRachhoya';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Configuration
const MAX_ACTIVITY_ITEMS = 8;
const PROXY_URL = 'https://api.github.com';

/**
 * Fetch recent activity from GitHub API
 */
async function fetchRecentActivity() {
  const options = {
    hostname: 'api.github.com',
    path: `/users/${USERNAME}/events/public?per_page=30`,
    method: 'GET',
    headers: {
      'User-Agent': 'GitHub-Profile-Updater',
      ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const events = JSON.parse(data);
          const activity = events
            .filter(event => ['PushEvent', 'CreateEvent', 'DeleteEvent', 'WatchEvent', 'ForkEvent', 'IssuesEvent', 'PullRequestEvent', 'PullRequestReviewEvent', 'ReleaseEvent'].includes(event.type))
            .slice(0, MAX_ACTIVITY_ITEMS)
            .map(event => {
              const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const repo = event.repo.name;
              const repoUrl = `https://github.com/${repo}`;
              
              switch (event.type) {
                case 'PushEvent':
                  const commits = event.payload.commits?.length || 1;
                  return `⚡ **Pushed** ${commits} commit${commits > 1 ? 's' : ''} to [${repo}](${repoUrl}) — ${date}`;
                case 'CreateEvent':
                  return `📦 **Created** ${event.payload.ref_type} in [${repo}](${repoUrl}) — ${date}`;
                case 'IssuesEvent':
                  const action = event.payload.action === 'opened' ? 'Opened' : event.payload.action === 'closed' ? 'Closed' : 'Updated';
                  return `🐛 **${action}** issue in [${repo}](${repoUrl}) — ${date}`;
                case 'PullRequestEvent':
                  const prAction = event.payload.action === 'opened' ? 'Opened' : event.payload.action === 'closed' ? 'Merged' : event.payload.action === 'merged' ? 'Merged' : 'Updated';
                  return `🔀 **${prAction}** PR in [${repo}](${repoUrl}) — ${date}`;
                case 'ForkEvent':
                  return `🍴 **Forked** [${repo}](${repoUrl}) — ${date}`;
                case 'WatchEvent':
                  return `⭐ **Starred** [${repo}](${repoUrl}) — ${date}`;
                case 'ReleaseEvent':
                  return `🚀 **Published** release in [${repo}](${repoUrl}) — ${date}`;
                default:
                  return `📌 **${event.type.replace('Event', '')}** in [${repo}](${repoUrl}) — ${date}`;
              }
            });
          resolve(activity);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch repository statistics
 */
async function fetchRepoStats() {
  const options = {
    hostname: 'api.github.com',
    path: `/users/${USERNAME}/repos?per_page=100&type=owner`,
    method: 'GET',
    headers: {
      'User-Agent': 'GitHub-Profile-Updater',
      ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const repos = JSON.parse(data);
          const stats = {
            totalRepos: repos.length,
            totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
            totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
            topRepos: repos
              .sort((a, b) => b.stargazers_count - a.stargazers_count)
              .slice(0, 3)
              .map(repo => ({
                name: repo.name,
                stars: repo.stargazers_count,
                url: repo.html_url,
                description: repo.description
              }))
          };
          resolve(stats);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Update README content
 */
async function updateReadme() {
  try {
    let readme = fs.readFileSync('README.md', 'utf8');
    
    // Update timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    const readableTime = now.toLocaleString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    readme = readme.replace(/<!-- TIMESTAMP:.*?-->/, `<!-- TIMESTAMP:${timestamp}-->`);
    readme = readme.replace(/Last refresh:.*?<\/span>/g, `Last refresh: ${readableTime} UTC</span>`);
    
    // Fetch and update activity section
    try {
      const activity = await fetchRecentActivity();
      const activityContent = activity.length > 0 
        ? activity.map(item => `- ${item}`).join('\n')
        : '> 🎯 No recent public activity. Check back soon!';
      
      const activitySection = `<!--START_SECTION:activity-->
${activityContent}

<em>Last updated: ${readableTime} UTC</em>
<!--END_SECTION:activity-->`;
      
      readme = readme.replace(
        /<!--START_SECTION:activity-->.*?<!--END_SECTION:activity-->/s,
        activitySection
      );
    } catch (e) {
      console.log('⚠️  Could not fetch activity:', e.message);
    }
    
    // Fetch and update stats
    try {
      const stats = await fetchRepoStats();
      
      // Update badges with dynamic stats
      readme = readme.replace(
        /https:\/\/img\.shields\.io\/badge\/Stars-\d+/,
        `https://img.shields.io/badge/Stars-${stats.totalStars}`
      );
      
      // Add contribution stats section if not exists
      const statsSection = `<!-- Stats Section -->
<div align="center">

**📊 Quick Stats:**

<span title="Total Stars">
  <img src="https://img.shields.io/badge/⭐%20Stars-${stats.totalStars}-gold?style=flat-square" />
</span>
<span title="Total Forks">
  <img src="https://img.shields.io/badge/🍴%20Forks-${stats.totalForks}-blue?style=flat-square" />
</span>
<span title="Public Repos">
  <img src="https://img.shields.io/badge/📁%20Repos-${stats.totalRepos}-green?style=flat-square" />
</span>

</div>`;
      
      console.log(`📊 Stats: ${stats.totalStars} ⭐ | ${stats.totalForks} 🍴 | ${stats.totalRepos} 📁`);
      console.log(`🔥 Top Repo: ${stats.topRepos[0]?.name} (${stats.topRepos[0]?.stars} stars)`);
      
    } catch (e) {
      console.log('⚠️  Could not fetch stats:', e.message);
    }
    
    fs.writeFileSync('README.md', readme);
    console.log('✅ README updated successfully!');
    
  } catch (e) {
    console.error('❌ Error updating README:', e);
    process.exit(1);
  }
}

// Run the update
updateReadme();
