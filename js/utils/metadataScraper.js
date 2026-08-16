// Simulated intelligent metadata fetcher for external eBook sales pages
import { validateExternalUrl } from './urlValidator.js';

export async function fetchExternalBookMetadata(url) {
  const validation = validateExternalUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Artificial realistic network delay for smooth animation
  await new Promise(resolve => setTimeout(resolve, 850));

  const domain = validation.domain;
  const path = new URL(validation.cleanUrl).pathname.toLowerCase();

  // Intelligent preset heuristic matching based on domain or path
  if (domain.includes('leanpub')) {
    return {
      title: 'Modern Software Engineering Architecture',
      subtitle: 'System Design Patterns, Micro-frontends and Cloud-Native Resiliency',
      author: 'Dr. Michael Hansen',
      description: 'Listed on Leanpub. A comprehensive deep dive into distributed cloud patterns, resilience boundaries, and modular microservices.',
      price: 39.00,
      category: 'Programming',
      language: 'English',
      format: 'PDF / Leanpub',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)'
    };
  } else if (domain.includes('gumroad')) {
    return {
      title: 'Visual Design Systems & Tokens Masterclass',
      subtitle: 'The Complete Guide to Multi-Brand Token Hierarchies and High-Converting UI',
      author: 'Sophia Rossi',
      description: 'Listed on Gumroad. Master modern design tokens, auto-layout architectures, and handoff workflows for high-growth tech startups.',
      price: 49.00,
      category: 'Design',
      language: 'English',
      format: 'PDF / Gumroad',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #701A75 0%, #C026D3 100%)'
    };
  } else if (domain.includes('amazon') || domain.includes('amzn')) {
    return {
      title: 'Exponential AI: Building Autonomous Agent Networks',
      subtitle: 'Multi-Agent Collaboration, Memory Graphs, and Self-Healing Workflows',
      author: 'Kevin Zhang',
      description: 'Available on Amazon Kindle & Paperback. Learn to construct autonomous LLM worker swarms that execute complex research and coding tasks.',
      price: 29.99,
      category: 'Artificial Intelligence',
      language: 'English',
      format: 'Kindle / Print',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #0F172A 0%, #0284C7 100%)'
    };
  } else {
    // Default smart title extraction from path/domain
    const rawName = path.split('/').filter(Boolean).pop() || 'Modern Digital Publication';
    const cleanTitle = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
      title: cleanTitle || 'Modern Digital eBook Guide',
      subtitle: 'Exclusive Publication from ' + domain,
      author: 'Verified Creator',
      description: `Discovered on ${domain}. Explore knowledge, structured guides, and insights directly from the original publisher.`,
      price: 25.00,
      category: 'Technology',
      language: 'English',
      format: 'PDF / Web',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #1E3A8A 0%, #6366F1 100%)'
    };
  }
}
