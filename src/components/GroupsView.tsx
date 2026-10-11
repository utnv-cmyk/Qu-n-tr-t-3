import React, { useState } from 'react';
import {
  Users2,
  FolderArchive,
  BookOpenCheck,
  Clapperboard,
  Plus,
  Crown,
  Lock,
  ArrowRight,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Settings,
  Phone,
} from 'lucide-react';
import { Assignment, DocumentItem, Member, ProductItem, StudyGroup } from '../types';
import { formatScore } from '../utils/scoreUtils';

interface Props {
  groups: StudyGroup[];
  members: Member[];
  documents: DocumentItem[];
  assignments: Assignment[];
  products: ProductItem[];
  currentMember: Member;
  onUpdateGroups: (groups: StudyGroup[]) => void;
  onDeleteGroup?: (group: StudyGroup) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const GroupsView: React.FC<Props> = ({
  groups,
  members,
  documents,
  assignments,
  products,
  currentMember,
  onUpdateGroups,
  onDeleteGroup,
  onOpenTrash,
  trashCount = 0,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([]);
  const [tasksText, setTasksText] = useState('');

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleOpenCreate = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền tạo nhóm học tập!', 'warning');
      return;
    }
    setEditingGroup(null);
    setName('');
    setDescription('');
    setLeaderName(members[0]?.name || '');
    setSelectedMemberNames(members.slice(0, 3).map((m) => m.name));
    setTasksText('Nghiên cứu tài liệu chuyên đề\nChuẩn bị bài thuyết trình nhóm');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: StudyGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền chỉnh sửa nhóm học tập!', 'warning');
      return;
    }
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description);
    setLeaderName(group.leaderName);
    setSelectedMemberNames([...group.members]);
    setTasksText(group.tasks.join('\n'));
    setIsModalOpen(true);
  };

  const handleDelete = (group: StudyGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa nhóm học tập!', 'error');
      return;
    }
    if (onDeleteGroup) {
      onDeleteGroup(group);
    } else {
      const nextGroups = groups.filter((g) => g.id !== group.id);
      onUpdateGroups(nextGroups);
    }
    showToast(`Đã chuyển nhóm "${group.name}" vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
    if (selectedGroupId === group.id) {
      const remaining = groups.filter((g) => g.id !== group.id);
      setSelectedGroupId(remaining[0]?.id || '');
    }
  };

  const handleToggleMember = (memberName: string) => {
    if (selectedMemberNames.includes(memberName)) {
      setSelectedMemberNames(selectedMemberNames.filter((n) => n !== memberName));
    } else {
      setSelectedMemberNames([...selectedMemberNames, memberName]);
    }
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên nhóm học tập!', 'warning');
      return;
    }

    const tasksList = tasksText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingGroup) {
      const updated = groups.map((g) =>
        g.id === editingGroup.id
          ? {
              ...g,
              name: name.trim(),
              description: description.trim(),
              leaderName: leaderName || g.leaderName,
              members: selectedMemberNames,
              tasks: tasksList.length > 0 ? tasksList : g.tasks,
            }
          : g
      );
      onUpdateGroups(updated);
      showToast(`Đã cập nhật nhóm "${name}" thành công!`);
    } else {
      const newGroup: StudyGroup = {
        id: 'group_' + Date.now(),
        name: name.trim(),
        description: description.trim(),
        leaderName: leaderName || members[0]?.name || 'Tổ trưởng',
        members: selectedMemberNames.length > 0 ? selectedMemberNames : [members[0]?.name],
        tasks: tasksList.length > 0 ? tasksList : ['Thực hiện nhiệm vụ được phân công'],
      };
      const nextGroups = [...groups, newGroup];
      onUpdateGroups(nextGroups);
      setSelectedGroupId(newGroup.id);
      showToast(`Đã tạo nhóm mới "${name}" thành công!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">👥 Nhóm Học Tập Cộng Tác Tổ 3</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {groups.length} nhóm
            </span>
            {!isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                <Lock size={12} /> Chế độ xem (Thành viên)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mô hình làm việc nhóm chuyên biệt theo thế mạnh: Tự nhiên, Xã hội, Ngoại ngữ & Tin học
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục nhóm đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLeader
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={isLeader ? 'Tạo nhóm học tập mới' : 'Chỉ Tổ trưởng mới có quyền tạo nhóm'}
          >
            {isLeader ? <Plus size={16} /> : <Lock size={14} />}
            <span>Tạo nhóm mới</span>
            {!isLeader && <span className="text-[10px] text-amber-600 font-bold">(🔒 Chỉ TT)</span>}
          </button>
        </div>
      </div>

      {/* Group Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroupId;

          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`cursor-pointer rounded-3xl p-5 border transition-all relative group/card ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-extrabold text-slate-900">{group.name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                    {group.members.length} bạn
                  </span>

                  {isLeader && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={(e) => handleOpenEdit(group, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 transition-colors"
                        title="Chỉnh sửa thông tin nhóm"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(group, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                        title="Xóa nhóm này (Chuyển vào thùng rác)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                {group.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                <Crown size={13} className="text-amber-500 shrink-0" />
                <span>Trưởng nhóm: <b>{group.leaderName}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Group Detailed Dashboard */}
      {activeGroup && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <h3 className="text-lg font-black text-slate-900">{activeGroup.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">{activeGroup.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Trưởng nhóm phụ trách: <b className="text-blue-700">{activeGroup.leaderName}</b>
              </div>
              {isLeader && (
                <button
                  onClick={() => handleOpenEdit(activeGroup)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-colors"
                  title="Cài đặt & Sửa thông tin nhóm này"
                >
                  <Settings size={14} /> Sửa nhóm
                </button>
              )}
            </div>
          </div>

          {/* Members in group */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Thành viên trong nhóm ({activeGroup.members.length} học sinh):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members
                .filter((m) => activeGroup.members.includes(m.name))
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{m.name}</h5>
                      <span className="text-[10px] text-slate-500 block truncate">{m.email}</span>
                      <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-slate-400 shrink-0" />
                        <span>{m.phone || 'Chưa có SĐT'}</span>
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                        Thi đua: {formatScore(m.netPoints)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Group Tasks */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Nhiệm vụ trọng tâm của nhóm:
            </h4>
            <div className="space-y-2">
              {activeGroup.tasks.map((taskTitle, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpenCheck size={16} className="text-blue-600" />
                    <span className="font-semibold text-slate-800">{taskTitle}</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                    Đang thực hiện
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Nhóm Học Tập */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg my-8 p-6 border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingGroup ? '✏️ Chỉnh Sửa Thông Tin Nhóm' : '✨ Tạo Nhóm Học Tập Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên nhóm học tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nhóm 1 - Tự nhiên (Toán - Lý - Hóa)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả nhiệm vụ nhóm:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả định hướng, nhiệm vụ trọng tâm..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trưởng nhóm phụ trách:</label>
                <select
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.role === 'leader' ? 'Tổ trưởng' : 'Thành viên'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn thành viên tham gia nhóm ({selectedMemberNames.length} đã chọn):
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {members.map((m) => {
                    const isChecked = selectedMemberNames.includes(m.name);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(m.name)}
                          className="rounded text-blue-600"
                        />
                        <span className="truncate">{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Các nhiệm vụ của nhóm (Mỗi nhiệm vụ một dòng):
                </label>
                <textarea
                  rows={3}
                  value={tasksText}
                  onChange={(e) => setTasksText(e.target.value)}
                  placeholder="Nhiệm vụ 1&#10;Nhiệm vụ 2&#10;Nhiệm vụ 3"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingGroup ? 'Lưu thay đổi nhóm' : 'Tạo nhóm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
