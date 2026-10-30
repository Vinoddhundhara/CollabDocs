import mongoose, { Document as MongooseDoc, Schema, Types } from 'mongoose';

export type CollaboratorRole = 'viewer' | 'editor';

export interface ICollaborator {
  user: Types.ObjectId;
  role: CollaboratorRole;
}

export interface IDocument extends MongooseDoc {
  title: string;
  content: Record<string, unknown>;
  owner: Types.ObjectId;
  collaborators: ICollaborator[];
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema = new Schema<ICollaborator>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
      required: true,
    },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Document',
      maxlength: 200,
    },
    content: {
      type: Schema.Types.Mixed,
      default: () => ({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      }),
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaborators: [CollaboratorSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying of documents owned or shared with a user
DocumentSchema.index({ owner: 1, updatedAt: -1 });
DocumentSchema.index({ 'collaborators.user': 1, updatedAt: -1 });

export const Doc = mongoose.model<IDocument>('Document', DocumentSchema);

