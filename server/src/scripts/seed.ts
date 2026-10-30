import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';
import { Doc } from '../models/Document';

export const DEMO_PASSWORD = 'Password123!';

export const seedDatabase = async () => {
  console.log('🌱 Starting CollabDocs database seeding...');

  if (!config.mongodbUri) {
    console.error('❌ MONGODB_URI is not configured! Cannot seed database.');
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for seeding.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

    // 1. Seed Users (idempotent: upsert based on email)
    const demoUsersData = [
      {
        email: 'alice@example.com',
        name: 'Alice Henderson',
        password: hashedPassword,
        avatarColor: '#7c3aed', // Indigo/violet
      },
      {
        email: 'bob@example.com',
        name: 'Bob Smith',
        password: hashedPassword,
        avatarColor: '#0284c7', // Sky blue
      },
      {
        email: 'charlie@example.com',
        name: 'Charlie Zhang',
        password: hashedPassword,
        avatarColor: '#059669', // Emerald
      },
    ];

    const usersMap: Record<string, any> = {};

    for (const userData of demoUsersData) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(` Created demo user: ${userData.email}`);
      } else {
        // Ensure password is up to date
        user.password = hashedPassword;
        user.name = userData.name;
        user.avatarColor = userData.avatarColor;
        await user.save();
        console.log(` Updated demo user: ${userData.email}`);
      }
      usersMap[userData.email] = user;
    }

    const alice = usersMap['alice@example.com'];
    const bob = usersMap['bob@example.com'];

    // 2. Seed Sample Documents if none exist for Alice
    const existingAliceDocs = await Doc.countDocuments({ owner: alice._id });
    if (existingAliceDocs === 0) {
      console.log(' Creating initial sample documents...');

      // Doc 1: Alice's Private Document
      await Doc.create({
        title: 'Product Strategy & Vision 2026',
        owner: alice._id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'CollabDocs: Product Strategy & Vision' }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Welcome to CollabDocs — an AI-native, lightweight collaborative document editor built with speed, focus, and modern design principles.',
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Core Objectives' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Distraction-free rich text editing powered by ' },
                        { type: 'text', marks: [{ type: 'bold' }], text: 'TipTap' },
                        { type: 'text', text: ' and ' },
                        { type: 'text', marks: [{ type: 'bold' }], text: 'Tailwind CSS' },
                        { type: 'text', text: '.' },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Granular permissions: ' },
                        { type: 'text', marks: [{ type: 'italic' }], text: 'Owners' },
                        { type: 'text', text: ' manage access, ' },
                        { type: 'text', marks: [{ type: 'italic' }], text: 'Editors' },
                        { type: 'text', text: ' collaborate, and ' },
                        { type: 'text', marks: [{ type: 'italic' }], text: 'Viewers' },
                        { type: 'text', text: ' stay informed without modifying content.' },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Instant Markdown and plain text file import with full safety parsing.' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'blockquote',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'italic' }],
                      text: 'Simplicity is the prerequisite for reliability. — Edsger W. Dijkstra',
                    },
                  ],
                },
              ],
            },
          ],
        },
        collaborators: [],
      });

      // Doc 2: Alice's Document Shared with Bob as Editor
      await Doc.create({
        title: 'Architecture & Technical Specifications',
        owner: alice._id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'CollabDocs Technical Specs' }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This document is shared with Bob as an ',
                },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Editor',
                },
                {
                  type: 'text',
                  text: '. Both Alice and Bob can edit this document and save changes simultaneously!',
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'System Architecture' }],
            },
            {
              type: 'orderedList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Client: React 18, Vite, TypeScript, Tailwind CSS, TipTap Editor' }],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Server: Node.js, Express, Mongoose, Zod, JWT' }],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Database: MongoDB with indexed schemas for sub-millisecond lookups' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        collaborators: [
          {
            user: bob._id,
            role: 'editor',
          },
        ],
      });

      console.log(' Seeded Alice sample documents.');
    }

    // 3. Seed Sample Document for Bob shared with Alice as Viewer
    const existingBobDocs = await Doc.countDocuments({ owner: bob._id });
    if (existingBobDocs === 0) {
      await Doc.create({
        title: 'Q4 Team Goals & KPIs [Viewer Protected]',
        owner: bob._id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Q4 Performance Review & KPIs' }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Note for Alice: ',
                },
                {
                  type: 'text',
                  text: 'You have ',
                },
                {
                  type: 'text',
                  marks: [{ type: 'underline' }, { type: 'italic' }],
                  text: 'Viewer (Read-Only)',
                },
                {
                  type: 'text',
                  text: ' access on this document. You can inspect all headings, text, and structure, but the editor toolbar is locked and edits will be rejected by server authorization.',
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Key Milestones' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '100% test pass rate on automated API tests' }] }],
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Clean autosave debouncing with zero data loss' }] }],
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rock-solid role-based permission verification' }] }],
                },
              ],
            },
          ],
        },
        collaborators: [
          {
            user: alice._id,
            role: 'viewer',
          },
        ],
      });

      console.log(' Seeded Bob sample document (shared with Alice as viewer).');
    }

    console.log('\n✅ Database seeding complete!');
    console.log('──────────────────────────────────────────────────────');
    console.log('Demo Accounts for Reviewer:');
    console.log('👤 Alice:   alice@example.com   / Password123!');
    console.log('👤 Bob:     bob@example.com     / Password123!');
    console.log('👤 Charlie: charlie@example.com / Password123!');
    console.log('──────────────────────────────────────────────────────\n');
  } catch (err: any) {
    console.error('❌ Database seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Seeder disconnected.');
  }
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}

