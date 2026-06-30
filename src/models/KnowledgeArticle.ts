import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeArticle extends Document {
  title: string;
  content: string;
  category: 'FAQ' | 'Policy' | 'Guide' | 'Documentation' | 'Other';
  tags: string[];
  createdBy: string;
  createdByName: string;
  views: number;
  helpful: number;
  notHelpful: number;
  published: boolean;
}

const KnowledgeArticleSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['FAQ', 'Policy', 'Guide', 'Documentation', 'Other'],
    default: 'FAQ'
  },
  tags: [{ type: String }],
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  views: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.KnowledgeArticle || mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema);
