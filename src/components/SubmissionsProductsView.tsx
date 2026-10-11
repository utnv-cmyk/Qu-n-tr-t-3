import React, { useState } from 'react';
import { Upload, Clapperboard, Sparkles } from 'lucide-react';
import { SubmissionsView } from './SubmissionsView';
import { ProductsView } from './ProductsView';
import {
  Assignment,
  FileItem,
  Member,
  ProductItem,
  Submission,
} from '../types';

interface Props {
  submissions: Submission[];
  products: ProductItem[];
  assignments: Assignment[];
  members: Member[];
  currentMember: Member;
  onUpdateSubmissions: (subs: Submission[]) => void;
  onDeleteSubmission?: (sub: Submission) => void;
  onUpdateProducts: (prods: ProductItem[]) => void;
  onDeleteProduct?: (prod: ProductItem) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onOpenSubmitModal: () => void;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  initialSubTab?: 'submissions' | 'products';
}

export const SubmissionsProductsView: React.FC<Props> = ({
  submissions,
  products,
  assignments,
  members,
  currentMember,
  onUpdateSubmissions,
  onDeleteSubmission,
  onUpdateProducts,
  onDeleteProduct,
  onOpenTrash,
  trashCount = 0,
  onOpenSubmitModal,
  onViewFile,
  showToast,
  initialSubTab = 'submissions',
}) => {
  const [subTab, setSubTab] = useState<'submissions' | 'products'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Sub-view switcher: Bài nộp vs Sản phẩm học tập */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between gap-2 max-w-xl mx-auto border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('submissions')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'submissions'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload size={16} />
          <span>Bài Đã Nộp</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              subTab === 'submissions'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {submissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('products')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'products'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clapperboard size={16} />
          <span>Kho Sản Phẩm Học Tập</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              subTab === 'products'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {products.length}
          </span>
        </button>
      </div>

      {/* Render Sub View */}
      {subTab === 'submissions' ? (
        <SubmissionsView
          submissions={submissions}
          assignments={assignments}
          members={members}
          currentMember={currentMember}
          onUpdateSubmissions={onUpdateSubmissions}
          onDeleteSubmission={onDeleteSubmission}
          onOpenTrash={onOpenTrash}
          trashCount={trashCount}
          onOpenSubmitModal={onOpenSubmitModal}
          onViewFile={onViewFile}
          showToast={showToast}
        />
      ) : (
        <ProductsView
          products={products}
          members={members}
          currentMember={currentMember}
          onUpdateProducts={onUpdateProducts}
          onDeleteProduct={onDeleteProduct}
          onOpenTrash={onOpenTrash}
          trashCount={trashCount}
          onViewFile={onViewFile}
          showToast={showToast}
        />
      )}
    </div>
  );
};
