import React, { useState } from 'react';
import {
  useListClanContacts,
  useCreateClanContact,
  useUpdateClanContact,
  useDeleteClanContact,
  useListHelpRequests,
  useSubmitHelpRequest,
  useUpdateHelpRequestStatus,
  useDeleteHelpRequest,
  useAddHelpRequestNote,
  useGetAdminNotes,
  useListDonationChannels,
  useCreateDonationChannel,
  useUpdateDonationChannel,
  useDeleteDonationChannel,
} from '../hooks/useQueries';
import type { ClanContact, HelpRequest, DonationChannel } from '../backend';
import UploadPasscodeModal from './UploadPasscodeModal';
import DeletePasscodeModal from './DeletePasscodeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Heart,
  HelpCircle,
  CreditCard,
  StickyNote,
  X,
  Check,
} from 'lucide-react';

type SubSection = 'leader' | 'group' | 'help' | 'donation';

// ─── Clan Contact Form ────────────────────────────────────────────────────────

interface ContactFormData {
  contactType: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  wechat: string;
  address: string;
  notes: string;
}

const emptyContactForm = (): ContactFormData => ({
  contactType: 'leader',
  name: '',
  role: '',
  phone: '',
  email: '',
  wechat: '',
  address: '',
  notes: '',
});

// ─── Donation Channel Form ────────────────────────────────────────────────────

interface DonationFormData {
  channelName: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  wechatPayQr: string;
  alipayQr: string;
  instructions: string;
}

const emptyDonationForm = (): DonationFormData => ({
  channelName: '',
  accountName: '',
  accountNumber: '',
  bankName: '',
  wechatPayQr: '',
  alipayQr: '',
  instructions: '',
});

// ─── Help Request Form ────────────────────────────────────────────────────────

interface HelpFormData {
  applicantName: string;
  contactInfo: string;
  requestType: string;
  description: string;
}

const emptyHelpForm = (): HelpFormData => ({
  applicantName: '',
  contactInfo: '',
  requestType: '',
  description: '',
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactClan() {
  const [activeSection, setActiveSection] = useState<SubSection>('leader');

  // Clan Contacts
  const { data: allContacts = [], isLoading: contactsLoading } = useListClanContacts();
  const createContact = useCreateClanContact();
  const updateContact = useUpdateClanContact();
  const deleteContact = useDeleteClanContact();

  // Help Requests
  const { data: helpRequests = [], isLoading: helpLoading } = useListHelpRequests();
  const submitHelp = useSubmitHelpRequest();
  const updateHelpStatus = useUpdateHelpRequestStatus();
  const deleteHelp = useDeleteHelpRequest();
  const addNote = useAddHelpRequestNote();
  const { data: adminNotes = {} } = useGetAdminNotes();

  // Donation Channels
  const { data: donationChannels = [], isLoading: donationLoading } = useListDonationChannels();
  const createDonation = useCreateDonationChannel();
  const updateDonation = useUpdateDonationChannel();
  const deleteDonation = useDeleteDonationChannel();

  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ClanContact | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormData>(emptyContactForm());
  const [contactFormType, setContactFormType] = useState<'leader' | 'group'>('leader');
  const [contactUploadOpen, setContactUploadOpen] = useState(false);
  const [contactDeleteOpen, setContactDeleteOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<bigint | null>(null);

  // Help form state
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpForm, setHelpForm] = useState<HelpFormData>(emptyHelpForm());
  const [helpSuccess, setHelpSuccess] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<Set<string>>(new Set());
  const [helpDeleteOpen, setHelpDeleteOpen] = useState(false);
  const [helpToDelete, setHelpToDelete] = useState<bigint | null>(null);
  // Add note state
  const [noteRequestId, setNoteRequestId] = useState<bigint | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notePasscodeOpen, setNotePasscodeOpen] = useState(false);
  const [pendingNoteRequestId, setPendingNoteRequestId] = useState<bigint | null>(null);

  // Donation form state
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationChannel | null>(null);
  const [donationForm, setDonationForm] = useState<DonationFormData>(emptyDonationForm());
  const [donationUploadOpen, setDonationUploadOpen] = useState(false);
  const [donationDeleteOpen, setDonationDeleteOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState<bigint | null>(null);

  const leaderContacts = allContacts.filter((c) => c.contactType === 'leader');
  const groupContacts = allContacts.filter((c) => c.contactType === 'group');

  // ─── Contact Handlers ───────────────────────────────────────────────────────

  function openAddContact(type: 'leader' | 'group') {
    setEditingContact(null);
    setContactFormType(type);
    setContactForm({ ...emptyContactForm(), contactType: type });
    setShowContactForm(true);
  }

  function openEditContact(contact: ClanContact) {
    setEditingContact(contact);
    setContactFormType(contact.contactType as 'leader' | 'group');
    setContactForm({
      contactType: contact.contactType,
      name: contact.name,
      role: contact.role,
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      wechat: contact.wechat ?? '',
      address: contact.address ?? '',
      notes: contact.notes ?? '',
    });
    setShowContactForm(true);
  }

  function handleContactSave() {
    setContactUploadOpen(true);
  }

  async function doSaveContact() {
    const params = {
      contactType: contactForm.contactType,
      name: contactForm.name,
      role: contactForm.role,
      phone: contactForm.phone || null,
      email: contactForm.email || null,
      wechat: contactForm.wechat || null,
      address: contactForm.address || null,
      notes: contactForm.notes || null,
    };
    if (editingContact) {
      await updateContact.mutateAsync({ id: editingContact.id, ...params });
    } else {
      await createContact.mutateAsync(params);
    }
    setShowContactForm(false);
    setEditingContact(null);
    setContactForm(emptyContactForm());
  }

  function handleDeleteContact(id: bigint) {
    setContactToDelete(id);
    setContactDeleteOpen(true);
  }

  async function doDeleteContact() {
    if (contactToDelete === null) return;
    await deleteContact.mutateAsync(contactToDelete);
    setContactToDelete(null);
  }

  // ─── Help Handlers ──────────────────────────────────────────────────────────

  async function handleSubmitHelp(e: React.FormEvent) {
    e.preventDefault();
    await submitHelp.mutateAsync(helpForm);
    setHelpForm(emptyHelpForm());
    setShowHelpForm(false);
    setHelpSuccess(true);
    setTimeout(() => setHelpSuccess(false), 4000);
  }

  function toggleHelpExpand(id: string) {
    setExpandedHelp((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteHelp(id: bigint) {
    setHelpToDelete(id);
    setHelpDeleteOpen(true);
  }

  async function doDeleteHelp() {
    if (helpToDelete === null) return;
    await deleteHelp.mutateAsync(helpToDelete);
    setHelpToDelete(null);
  }

  function handleAddNote(requestId: bigint) {
    setNoteRequestId(requestId);
    setNoteText(adminNotes[requestId.toString()] ?? '');
  }

  function handleNoteSubmit() {
    if (!noteRequestId) return;
    setPendingNoteRequestId(noteRequestId);
    setNotePasscodeOpen(true);
  }

  async function doSaveNote() {
    if (!pendingNoteRequestId) return;
    await addNote.mutateAsync({ requestId: pendingNoteRequestId, note: noteText });
    setNoteRequestId(null);
    setNoteText('');
    setPendingNoteRequestId(null);
  }

  // ─── Donation Handlers ──────────────────────────────────────────────────────

  function openAddDonation() {
    setEditingDonation(null);
    setDonationForm(emptyDonationForm());
    setShowDonationForm(true);
  }

  function openEditDonation(channel: DonationChannel) {
    setEditingDonation(channel);
    setDonationForm({
      channelName: channel.channelName,
      accountName: channel.accountName ?? '',
      accountNumber: channel.accountNumber ?? '',
      bankName: channel.bankName ?? '',
      wechatPayQr: channel.wechatPayQr ?? '',
      alipayQr: channel.alipayQr ?? '',
      instructions: channel.instructions ?? '',
    });
    setShowDonationForm(true);
  }

  function handleDonationSave() {
    setDonationUploadOpen(true);
  }

  async function doSaveDonation() {
    const params = {
      channelName: donationForm.channelName,
      accountName: donationForm.accountName || null,
      accountNumber: donationForm.accountNumber || null,
      bankName: donationForm.bankName || null,
      wechatPayQr: donationForm.wechatPayQr || null,
      alipayQr: donationForm.alipayQr || null,
      instructions: donationForm.instructions || null,
    };
    if (editingDonation) {
      await updateDonation.mutateAsync({ id: editingDonation.id, ...params });
    } else {
      await createDonation.mutateAsync(params);
    }
    setShowDonationForm(false);
    setEditingDonation(null);
    setDonationForm(emptyDonationForm());
  }

  function handleDeleteDonation(id: bigint) {
    setDonationToDelete(id);
    setDonationDeleteOpen(true);
  }

  async function doDeleteDonation() {
    if (donationToDelete === null) return;
    await deleteDonation.mutateAsync(donationToDelete);
    setDonationToDelete(null);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const navItems: { key: SubSection; label: string; icon: React.ReactNode }[] = [
    { key: 'leader', label: '族长联系', icon: <Users className="w-4 h-4" /> },
    { key: 'group', label: '宗族群组', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'help', label: '求助申请', icon: <HelpCircle className="w-4 h-4" /> },
    { key: 'donation', label: '捐款渠道', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-ink/20 pb-4">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeSection === item.key
                ? 'bg-seal text-parchment shadow-seal'
                : 'bg-parchment-dark text-ink hover:bg-seal/10 hover:text-seal'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Leader Contacts ── */}
      {activeSection === 'leader' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-ink font-semibold">族长联系方式</h3>
            <Button
              size="sm"
              onClick={() => openAddContact('leader')}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加联系人
            </Button>
          </div>

          {contactsLoading ? (
            <div className="text-center py-8 text-ink/50">加载中...</div>
          ) : leaderContacts.length === 0 ? (
            <div className="text-center py-12 text-ink/40 font-serif">暂无族长联系方式</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {leaderContacts.map((contact) => (
                <ContactCard
                  key={contact.id.toString()}
                  contact={contact}
                  onEdit={() => openEditContact(contact)}
                  onDelete={() => handleDeleteContact(contact.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Group Contacts ── */}
      {activeSection === 'group' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-ink font-semibold">宗族群组联系</h3>
            <Button
              size="sm"
              onClick={() => openAddContact('group')}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加群组
            </Button>
          </div>

          {contactsLoading ? (
            <div className="text-center py-8 text-ink/50">加载中...</div>
          ) : groupContacts.length === 0 ? (
            <div className="text-center py-12 text-ink/40 font-serif">暂无群组联系方式</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {groupContacts.map((contact) => (
                <ContactCard
                  key={contact.id.toString()}
                  contact={contact}
                  onEdit={() => openEditContact(contact)}
                  onDelete={() => handleDeleteContact(contact.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Help Requests ── */}
      {activeSection === 'help' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-ink font-semibold">求助申请</h3>
            <Button
              size="sm"
              onClick={() => setShowHelpForm(!showHelpForm)}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Plus className="w-4 h-4 mr-1" />
              提交申请
            </Button>
          </div>

          {helpSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              申请已成功提交，我们将尽快与您联系。
            </div>
          )}

          {showHelpForm && (
            <form
              onSubmit={handleSubmitHelp}
              className="bg-parchment-dark border border-ink/20 rounded-lg p-4 space-y-3"
            >
              <h4 className="font-serif text-ink font-medium">填写求助申请</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">申请人姓名 *</label>
                  <Input
                    value={helpForm.applicantName}
                    onChange={(e) => setHelpForm({ ...helpForm, applicantName: e.target.value })}
                    placeholder="请输入姓名"
                    required
                    className="bg-parchment border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">联系方式</label>
                  <Input
                    value={helpForm.contactInfo}
                    onChange={(e) => setHelpForm({ ...helpForm, contactInfo: e.target.value })}
                    placeholder="电话/微信/邮箱"
                    className="bg-parchment border-ink/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink/60 mb-1 block">申请类型 *</label>
                <Input
                  value={helpForm.requestType}
                  onChange={(e) => setHelpForm({ ...helpForm, requestType: e.target.value })}
                  placeholder="如：经济援助、医疗帮助、教育支持等"
                  required
                  className="bg-parchment border-ink/30"
                />
              </div>
              <div>
                <label className="text-xs text-ink/60 mb-1 block">详细描述</label>
                <Textarea
                  value={helpForm.description}
                  onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })}
                  placeholder="请详细描述您的情况和需求..."
                  rows={3}
                  className="bg-parchment border-ink/30"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHelpForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitHelp.isPending}
                  className="bg-seal hover:bg-seal/90 text-parchment"
                >
                  {submitHelp.isPending ? '提交中...' : '提交申请'}
                </Button>
              </div>
            </form>
          )}

          {helpLoading ? (
            <div className="text-center py-8 text-ink/50">加载中...</div>
          ) : helpRequests.length === 0 ? (
            <div className="text-center py-12 text-ink/40 font-serif">暂无求助申请记录</div>
          ) : (
            <div className="space-y-3">
              {helpRequests.map((req) => {
                const idStr = req.id.toString();
                const isExpanded = expandedHelp.has(idStr);
                const note = adminNotes[idStr];
                const isAddingNote = noteRequestId?.toString() === idStr;

                return (
                  <div
                    key={idStr}
                    className="bg-parchment-dark border border-ink/20 rounded-lg overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-ink">{req.applicantName}</span>
                            <Badge
                              variant={
                                req.status === 'pending'
                                  ? 'outline'
                                  : req.status === 'approved'
                                    ? 'default'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {req.status === 'pending'
                                ? '待处理'
                                : req.status === 'approved'
                                  ? '已批准'
                                  : req.status === 'rejected'
                                    ? '已拒绝'
                                    : req.status}
                            </Badge>
                            <span className="text-xs text-ink/50">{req.requestType}</span>
                          </div>
                          {req.contactInfo && (
                            <p className="text-xs text-ink/60 mt-1">{req.contactInfo}</p>
                          )}
                          {note && (
                            <div className="mt-2 flex items-start gap-1 bg-gold/10 border border-gold/30 rounded px-2 py-1">
                              <StickyNote className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                              <p className="text-xs text-ink/80">{note}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleHelpExpand(idStr)}
                            className="p-1 text-ink/40 hover:text-ink transition-colors"
                            title="展开详情"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleAddNote(req.id)}
                            className="p-1 text-ink/40 hover:text-gold transition-colors"
                            title="添加备注"
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHelp(req.id)}
                            className="p-1 text-ink/40 hover:text-seal transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline note form */}
                      {isAddingNote && (
                        <div className="mt-3 border-t border-ink/10 pt-3 space-y-2">
                          <label className="text-xs text-ink/60 block">管理员备注</label>
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="输入备注内容..."
                            rows={2}
                            className="bg-parchment border-ink/30 text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNoteRequestId(null);
                                setNoteText('');
                              }}
                            >
                              <X className="w-3 h-3 mr-1" />
                              取消
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleNoteSubmit}
                              disabled={addNote.isPending}
                              className="bg-seal hover:bg-seal/90 text-parchment"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              保存备注
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Status update buttons */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-ink/10 pt-3 space-y-2">
                          {req.description && (
                            <p className="text-sm text-ink/80 whitespace-pre-wrap">
                              {req.description}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs text-ink/50 self-center">更新状态：</span>
                            {['pending', 'approved', 'rejected', 'completed'].map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  updateHelpStatus.mutate({ id: req.id, status: s })
                                }
                                disabled={req.status === s || updateHelpStatus.isPending}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                  req.status === s
                                    ? 'bg-seal/20 border-seal/40 text-seal'
                                    : 'border-ink/20 text-ink/60 hover:border-seal/40 hover:text-seal'
                                } disabled:opacity-50`}
                              >
                                {s === 'pending'
                                  ? '待处理'
                                  : s === 'approved'
                                    ? '已批准'
                                    : s === 'rejected'
                                      ? '已拒绝'
                                      : '已完成'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Donation Channels ── */}
      {activeSection === 'donation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-ink font-semibold">捐款渠道</h3>
            <Button
              size="sm"
              onClick={openAddDonation}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加渠道
            </Button>
          </div>

          {donationLoading ? (
            <div className="text-center py-8 text-ink/50">加载中...</div>
          ) : donationChannels.length === 0 ? (
            <div className="text-center py-12 text-ink/40 font-serif">暂无捐款渠道信息</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {donationChannels.map((channel) => (
                <DonationCard
                  key={channel.id.toString()}
                  channel={channel}
                  onEdit={() => openEditDonation(channel)}
                  onDelete={() => handleDeleteDonation(channel.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contact Form Modal ── */}
      {showContactForm && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-parchment rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-semibold text-ink">
                  {editingContact ? '编辑联系人' : '添加联系人'}
                </h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-ink/40 hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">姓名 *</label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="联系人姓名"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">职务/角色</label>
                  <Input
                    value={contactForm.role}
                    onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                    placeholder="如：族长、副族长、秘书等"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">电话</label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="联系电话"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">微信</label>
                    <Input
                      value={contactForm.wechat}
                      onChange={(e) => setContactForm({ ...contactForm, wechat: e.target.value })}
                      placeholder="微信号"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">邮箱</label>
                  <Input
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="电子邮箱"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">地址</label>
                  <Input
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="联系地址"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">备注</label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="其他备注信息"
                    rows={2}
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowContactForm(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleContactSave}
                  disabled={!contactForm.name}
                  className="bg-seal hover:bg-seal/90 text-parchment"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Donation Form Modal ── */}
      {showDonationForm && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-parchment rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-semibold text-ink">
                  {editingDonation ? '编辑捐款渠道' : '添加捐款渠道'}
                </h3>
                <button
                  onClick={() => setShowDonationForm(false)}
                  className="text-ink/40 hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">渠道名称 *</label>
                  <Input
                    value={donationForm.channelName}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, channelName: e.target.value })
                    }
                    placeholder="如：银行转账、微信支付等"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">账户名</label>
                    <Input
                      value={donationForm.accountName}
                      onChange={(e) =>
                        setDonationForm({ ...donationForm, accountName: e.target.value })
                      }
                      placeholder="账户持有人姓名"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">账号</label>
                    <Input
                      value={donationForm.accountNumber}
                      onChange={(e) =>
                        setDonationForm({ ...donationForm, accountNumber: e.target.value })
                      }
                      placeholder="银行账号"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">开户银行</label>
                  <Input
                    value={donationForm.bankName}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, bankName: e.target.value })
                    }
                    placeholder="银行名称及支行"
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">微信支付二维码链接</label>
                    <Input
                      value={donationForm.wechatPayQr}
                      onChange={(e) =>
                        setDonationForm({ ...donationForm, wechatPayQr: e.target.value })
                      }
                      placeholder="二维码图片URL"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">支付宝二维码链接</label>
                    <Input
                      value={donationForm.alipayQr}
                      onChange={(e) =>
                        setDonationForm({ ...donationForm, alipayQr: e.target.value })
                      }
                      placeholder="二维码图片URL"
                      className="bg-parchment-dark border-ink/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">说明</label>
                  <Textarea
                    value={donationForm.instructions}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, instructions: e.target.value })
                    }
                    placeholder="捐款说明或注意事项"
                    rows={2}
                    className="bg-parchment-dark border-ink/30"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowDonationForm(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleDonationSave}
                  disabled={!donationForm.channelName}
                  className="bg-seal hover:bg-seal/90 text-parchment"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Passcode Modals — use `open` prop (not `isOpen`) ── */}
      <UploadPasscodeModal
        open={contactUploadOpen}
        onClose={() => setContactUploadOpen(false)}
        onConfirmed={() => {
          setContactUploadOpen(false);
          doSaveContact();
        }}
      />
      <DeletePasscodeModal
        open={contactDeleteOpen}
        onClose={() => setContactDeleteOpen(false)}
        onConfirmed={() => {
          setContactDeleteOpen(false);
          doDeleteContact();
        }}
      />
      <UploadPasscodeModal
        open={donationUploadOpen}
        onClose={() => setDonationUploadOpen(false)}
        onConfirmed={() => {
          setDonationUploadOpen(false);
          doSaveDonation();
        }}
      />
      <DeletePasscodeModal
        open={donationDeleteOpen}
        onClose={() => setDonationDeleteOpen(false)}
        onConfirmed={() => {
          setDonationDeleteOpen(false);
          doDeleteDonation();
        }}
      />
      <DeletePasscodeModal
        open={helpDeleteOpen}
        onClose={() => setHelpDeleteOpen(false)}
        onConfirmed={() => {
          setHelpDeleteOpen(false);
          doDeleteHelp();
        }}
      />
      <UploadPasscodeModal
        open={notePasscodeOpen}
        onClose={() => {
          setNotePasscodeOpen(false);
          setPendingNoteRequestId(null);
        }}
        onConfirmed={() => {
          setNotePasscodeOpen(false);
          doSaveNote();
        }}
      />
    </div>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: ClanContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-parchment-dark border border-ink/20 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-ink">{contact.name}</h4>
          {contact.role && <p className="text-xs text-ink/60">{contact.role}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-ink/40 hover:text-ink transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-ink/40 hover:text-seal transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <Phone className="w-3 h-3 text-seal" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.wechat && (
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <MessageSquare className="w-3 h-3 text-seal" />
            <span>微信: {contact.wechat}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <Mail className="w-3 h-3 text-seal" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.address && (
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <MapPin className="w-3 h-3 text-seal" />
            <span>{contact.address}</span>
          </div>
        )}
        {contact.notes && (
          <p className="text-xs text-ink/50 mt-1 italic">{contact.notes}</p>
        )}
      </div>
    </div>
  );
}

// ─── Donation Card ────────────────────────────────────────────────────────────

function DonationCard({
  channel,
  onEdit,
  onDelete,
}: {
  channel: DonationChannel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-parchment-dark border border-ink/20 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-seal" />
          <h4 className="font-medium text-ink">{channel.channelName}</h4>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-ink/40 hover:text-ink transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-ink/40 hover:text-seal transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1 text-sm text-ink/70">
        {channel.accountName && <p>账户名：{channel.accountName}</p>}
        {channel.accountNumber && <p>账号：{channel.accountNumber}</p>}
        {channel.bankName && <p>开户行：{channel.bankName}</p>}
        {channel.wechatPayQr && (
          <p className="text-xs text-ink/50">微信支付二维码已配置</p>
        )}
        {channel.alipayQr && (
          <p className="text-xs text-ink/50">支付宝二维码已配置</p>
        )}
        {channel.instructions && (
          <p className="text-xs text-ink/60 italic mt-1">{channel.instructions}</p>
        )}
      </div>
    </div>
  );
}
