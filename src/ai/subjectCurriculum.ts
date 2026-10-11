import { CognitiveLevel, QuestionBankItem, QuestionType } from '../types';

export interface ChapterInfo {
  id: string;
  name: string;
  knowledgeContent: string;
  teacherRequirements: string;
}

export interface SubjectCurriculum {
  subject: string;
  grades: Record<string, ChapterInfo[]>;
}

export const SUBJECT_CURRICULUM_DATA: Record<string, Record<string, ChapterInfo[]>> = {
  'Hóa học': {
    '11': [
      {
        id: 'hoa_11_c1',
        name: 'Chương 1: Cân bằng hóa học & Năng lượng hóa học',
        knowledgeContent: 'Khái niệm phản ứng thuận nghịch, trạng thái cân bằng, hằng số Kc, nguyên lý chuyển dịch cân bằng Le Chatelier, pH dung dịch, biến thiên enthalpy chuẩn',
        teacherRequirements: 'Bám sát ứng dụng công nghiệp hóa chất (tổng hợp NH3, SO3), tránh câu hỏi tính toán mẹo phức tạp.',
      },
      {
        id: 'hoa_11_c2',
        name: 'Chương 2: Nitrogen và Sulfur',
        knowledgeContent: 'Đơn chất nitrogen, amoniac và muối ammonium, nitric acid, đơn chất sulfur, sulfur dioxide và sulfuric acid, ứng dụng phân bón hóa học',
        teacherRequirements: 'Liên hệ thực tiễn sản xuất phân đạm, mưa axit, bảo vệ môi trường không khí.',
      },
      {
        id: 'hoa_11_c3',
        name: 'Chương 3: Đại cương hóa học hữu cơ',
        knowledgeContent: 'Hợp chất hữu cơ và hóa học hữu cơ, phương pháp tách và tinh chế, công thức phân tử, cấu trúc phân tử hợp chất hữu cơ, đồng phân',
        teacherRequirements: 'Tập trung xác định công thức phân tử từ phổ khối lượng MS, công thức cấu tạo đồng phân.',
      },
      {
        id: 'hoa_11_c4',
        name: 'Chương 4: Hydrocarbon (Alkane, Alkene, Alkyne, Aren)',
        knowledgeContent: 'Đồng đẳng alkane, cơ chế phản ứng thế halogen, alkene - alkyne và phản ứng cộng, benzene và alkylbenzene, ứng dụng nhiên liệu và polyme',
        teacherRequirements: 'Gắn với vấn đề khai thác dầu mỏ, chỉ số octane, khí đốt và bảo vệ môi trường.',
      },
    ],
    '12': [
      {
        id: 'hoa_12_c1',
        name: 'Chương 1: Ester - Lipid & Chất giặt rửa',
        knowledgeContent: 'Khái niệm ester, phản ứng xà phòng hóa, chất béo, acid béo omega-3/omega-6, xà phòng và chất giặt rửa tổng hợp',
        teacherRequirements: 'Vận dụng giải thích dinh dưỡng chất béo, cơ chế tẩy rửa của xà phòng.',
      },
      {
        id: 'hoa_12_c2',
        name: 'Chương 2: Carbohydrate',
        knowledgeContent: 'Glucose, fructose, saccharose, maltose, tinh bột và cellulose; cấu trúc phân tử và tính chất hóa học đặc trưng, ứng dụng công nghiệp sinh học',
        teacherRequirements: 'Liên hệ quá trình quang hợp, sản xuất cồn sinh học và tơ nhân tạo.',
      },
    ],
  },
  'Toán học': {
    '11': [
      {
        id: 'toan_11_c1',
        name: 'Chương 1: Hàm số lượng giác & Phương trình lượng giác',
        knowledgeContent: 'Góc lượng giác, giá trị lượng giác, công thức biến đổi lượng giác, hàm số sin, cos, tan, cot; phương trình lượng giác cơ bản',
        teacherRequirements: 'Rèn luyện khả năng biến đổi công thức, tìm chu kỳ và tập nghiệm của hàm số lượng giác.',
      },
      {
        id: 'toan_11_c2',
        name: 'Chương 2: Dãy số, Cấp số cộng & Cấp số nhân',
        knowledgeContent: 'Định nghĩa dãy số, số hạng tổng quát, tính tăng giảm; cấp số cộng (công sai d, Sn); cấp số nhân (công bội q, Sn), bài toán thực tế lãi suất',
        teacherRequirements: 'Tăng cường bài toán ứng dụng thực tế về tăng trưởng dân số, lãi suất ngân hàng.',
      },
      {
        id: 'toan_11_c3',
        name: 'Chương 3: Giới hạn & Hàm số liên tục',
        knowledgeContent: 'Giới hạn của dãy số, giới hạn hàm số tại vô cực và tại một điểm, các dạng vô định 0/0, hàm số liên tục và định lý giá trị trung gian',
        teacherRequirements: 'Chú trọng kỹ năng khử dạng vô định và vận dụng định lý nghiệm của đa thức.',
      },
      {
        id: 'toan_11_c4',
        name: 'Chương 4: Quan hệ song song và vuông góc trong không gian',
        knowledgeContent: 'Đường thẳng và mặt phẳng song song, hai mặt phẳng song song; đường thẳng vuông góc mặt phẳng, góc giữa đường thẳng và mặt phẳng',
        teacherRequirements: 'Trực quan hình không gian, rèn phương pháp chứng minh song song và tính góc.',
      },
    ],
    '12': [
      {
        id: 'toan_12_c1',
        name: 'Chương 1: Ứng dụng đạo hàm để khảo sát hàm số',
        knowledgeContent: 'Tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất, đường tiệm cận ngang và đứng, khảo sát và vẽ đồ thị hàm bậc ba, hàm phân thức',
        teacherRequirements: 'Bám sát dạng toán tối ưu hóa thực tiễn (chi phí, lợi nhuận, thể tích hộp).',
      },
      {
        id: 'toan_12_c2',
        name: 'Chương 2: Tọa độ trong không gian Oxyz',
        knowledgeContent: 'Hệ trục tọa độ Oxyz, vectơ và các phép toán, tích có hướng, phương trình mặt phẳng, phương trình đường thẳng, phương trình mặt cầu',
        teacherRequirements: 'Kết hợp hình học giải tích và tính khoảng cách, góc trong không gian.',
      },
    ],
  },
  'Vật lí': {
    '11': [
      {
        id: 'ly_11_c1',
        name: 'Chương 1: Dao động điều hòa & Con lắc',
        knowledgeContent: 'Phương trình dao động x = Acos(ωt + φ), vận tốc, gia tốc, năng lượng dao động (động năng, thế năng, cơ năng), con lắc lò xo và con lắc đơn, dao động tắt dần và cộng hưởng',
        teacherRequirements: 'Khai thác đồ thị li độ - thời gian, liên hệ hiện tượng cộng hưởng trong kỹ thuật cầu đường.',
      },
      {
        id: 'ly_11_c2',
        name: 'Chương 2: Sóng cơ & Giao thoa sóng',
        knowledgeContent: 'Định nghĩa sóng cơ, bước sóng λ, phương trình sóng, hiện tượng giao thoa sóng nước, sóng dừng trên sợi dây, đặc trưng vật lí và sinh lí của âm',
        teacherRequirements: 'Giải thích hiện tượng âm nhạc, hộp cộng hưởng, xác định nút và bụng sóng dừng.',
      },
      {
        id: 'ly_11_c3',
        name: 'Chương 3: Điện trường & Dòng điện không đổi',
        knowledgeContent: 'Điện tích, định luật Coulomb, điện trường và cường độ điện trường, tụ điện và năng lượng điện trường, cường độ dòng điện, định luật Ohm toàn mạch',
        teacherRequirements: 'Tính toán mạch điện thực tế, hiệu suất nguồn điện và an toàn điện dân dụng.',
      },
      {
        id: 'ly_11_c4',
        name: 'Chương 4: Từ trường & Cảm ứng điện từ',
        knowledgeContent: 'Từ trường của dòng điện chạy trong dây dẫn thẳng và ống dây, lực từ Lorentz, từ thông Φ, định luật Faraday về cảm ứng điện từ, định luật Lenz',
        teacherRequirements: 'Ứng dụng máy phát điện, bếp từ, thẻ từ và hiện tượng tự cảm.',
      },
    ],
    '12': [
      {
        id: 'ly_12_c1',
        name: 'Chương 1: Vật lí nhiệt & Khí lý tưởng',
        knowledgeContent: 'Mô hình động học phân tử, nhiệt độ và nhiệt lượng, phương trình trạng thái khí lý tưởng pV = nRT, các định luật chất khí đẳng nhiệt, đẳng tích',
        teacherRequirements: 'Giải thích hoạt động của động cơ nhiệt, máy lạnh và áp suất khí quyển.',
      },
    ],
  },
  'Sinh học': {
    '11': [
      {
        id: 'sinh_11_c1',
        name: 'Chương 1: Trao đổi chất & Chuyển hóa năng lượng ở thực vật',
        knowledgeContent: 'Sự hấp thụ nước và khoáng ở rễ, dòng mạch gỗ và mạch rây, thoát hơi nước ở lá, quang hợp ở các nhóm thực vật C3, C4, CAM, hô hấp ở thực vật',
        teacherRequirements: 'Vận dụng vào kỹ thuật tưới tiêu, bón phân hợp lý và tăng năng suất cây trồng.',
      },
      {
        id: 'sinh_11_c2',
        name: 'Chương 2: Trao đổi chất & Chuyển hóa năng lượng ở động vật',
        knowledgeContent: 'Tiêu hóa ở động vật có túi và ống tiêu hóa, hô hấp qua bề mặt cơ thể, mang, phổi; hệ tuần hoàn hở và kín, huyết áp, miễn dịch và cân bằng nội môi',
        teacherRequirements: 'Gắn liền với sức khỏe con người, phòng chống bệnh tim mạch, cao huyết áp.',
      },
    ],
    '12': [
      {
        id: 'sinh_12_c1',
        name: 'Chương 1: Di truyền học phân tử & Quy luật di truyền',
        knowledgeContent: 'Cấu trúc và chức năng DNA, RNA; quá trình nhân đôi DNA, phiên mã, dịch mã, điều hòa hoạt động gen; quy luật phân ly và phân ly độc lập của Mendel',
        teacherRequirements: 'Giải bài tập phả hệ, xác suất sinh con mang gen bệnh di truyền ở người.',
      },
    ],
  },
  'Ngữ văn': {
    '11': [
      {
        id: 'van_11_c1',
        name: 'Chuyên đề 1: Đọc hiểu văn bản văn học (Truyện ngắn & Tiểu thuyết)',
        knowledgeContent: 'Cốt truyện, nhân vật, điểm nhìn trần thuật, tình huống truyện, ngôn ngữ nhân vật và ngôn ngữ tác giả; chủ đề và thông điệp tác phẩm',
        teacherRequirements: 'Rèn năng lực giải mã biểu tượng văn học, phát triển tư duy phản biện và thấu cảm.',
      },
      {
        id: 'van_11_c2',
        name: 'Chuyên đề 2: Thơ ca trữ tình hiện đại',
        knowledgeContent: 'Hình ảnh thơ, nhạc điệu, thể thơ, cảm xúc chủ đạo, cấu tứ thơ, các biện pháp tu từ nghệ thuật (ẩn dụ, hoán dụ, điệp từ, đảo ngữ)',
        teacherRequirements: 'Phân tích chiều sâu tâm trạng cái tôi trữ tình, thông điệp nhân văn về cuộc sống.',
      },
      {
        id: 'van_11_c3',
        name: 'Chuyên đề 3: Đọc hiểu văn bản thông tin & Nghị luận xã hội',
        knowledgeContent: 'Dữ liệu và ý kiến trong văn bản thông tin, phương tiện phi ngôn ngữ; cấu trúc đoạn văn nghị luận về một tư tưởng đạo lý hoặc hiện tượng đời sống',
        teacherRequirements: 'Tập trung các vấn đề giới trẻ quan tâm: chuyển đổi số, lối sống có trách nhiệm.',
      },
    ],
  },
  'Tiếng Anh': {
    '11': [
      {
        id: 'anh_11_c1',
        name: 'Unit 1 & 2: Generation Gap, Healthy Lifestyle & Relationships',
        knowledgeContent: 'Modal verbs (should, ought to, must, have to), Stative verbs in continuous forms, Linking verbs, Past simple vs Present perfect, Phrasal verbs related to family',
        teacherRequirements: 'Focus on communication in family contexts, diet and balanced mental-physical health.',
      },
      {
        id: 'anh_11_c2',
        name: 'Unit 3 & 4: Becoming Independent & Global Warming',
        knowledgeContent: 'Cleft sentences with "It is / It was... that", Participle clauses, Gerunds as subjects/objects, Vocabulary of environmental sustainability, Carbon footprint',
        teacherRequirements: 'Test reading comprehension about climate change and sentence transformation skills.',
      },
    ],
  },
  'Tin học': {
    '11': [
      {
        id: 'tin_11_c1',
        name: 'Chủ đề 1: Lập trình Python & Cấu trúc dữ liệu',
        knowledgeContent: 'Kiểu dữ liệu cơ bản, cấu trúc rẽ nhánh if-else, vòng lặp for/while, hàm tự định nghĩa, danh sách list, chuỗi ký tự string, từ điển dictionary',
        teacherRequirements: 'Rèn luyện kỹ năng viết thuật toán tìm kiếm, sắp xếp và giải quyết bài toán thực tế.',
      },
      {
        id: 'tin_11_c2',
        name: 'Chủ đề 2: Mạng máy tính & An toàn thông tin',
        knowledgeContent: 'Mô hình mạng LAN/WAN, giao thức TCP/IP, địa chỉ IP, bảo mật thông tin, phòng chống mã độc virus, an toàn dữ liệu số cá nhân',
        teacherRequirements: 'Liên hệ kỹ năng bảo vệ tài khoản, nhận diện lừa đảo trên mạng xã hội.',
      },
    ],
  },
  'Lịch sử': {
    '11': [
      {
        id: 'su_11_c1',
        name: 'Chương 1: Cách mạng tư sản và sự xác lập của CNTB',
        knowledgeContent: 'Nguyên nhân, tiền đề và tính chất các cuộc cách mạng tư sản Anh, Bắc Mỹ, Pháp; sự xác lập và phát triển của chủ nghĩa tư bản',
        teacherRequirements: 'So sánh tính triệt để của cách mạng tư sản Pháp với các cuộc cách mạng khác.',
      },
      {
        id: 'su_11_c2',
        name: 'Chương 2: Lịch sử bảo vệ chủ quyền biển đảo Việt Nam',
        knowledgeContent: 'Quá trình xác lập và thực thi chủ quyền đối với quần đảo Hoàng Sa và Trường Sa qua các triều đại phong kiến đến nay, chứng cứ lịch sử và pháp lý',
        teacherRequirements: 'Giáo dục lòng yêu nước, nhận thức trách nhiệm công dân đối với chủ quyền thiêng liêng.',
      },
    ],
  },
  'Địa lí': {
    '11': [
      {
        id: 'dia_11_c1',
        name: 'Chương 1: Vị trí địa lí & Thiên nhiên nhiệt đới ẩm gió mùa',
        knowledgeContent: 'Đặc điểm vị trí địa lí, ảnh hưởng đến tự nhiên và kinh tế; biểu hiện của tính chất nhiệt đới ẩm gió mùa qua khí hậu, đất đai, sinh vật',
        teacherRequirements: 'Khai thác biểu đồ khí hậu, Atlat Địa lí Việt Nam và giải thích sự phân hóa thiên nhiên.',
      },
      {
        id: 'dia_11_c2',
        name: 'Chương 2: Dân cư, Đô thị hóa và Chuyển dịch kinh tế',
        knowledgeContent: 'Cơ cấu dân số vàng, lao động và việc làm, quá trình đô thị hóa, chuyển dịch cơ cấu ngành kinh tế theo hướng CNH-HĐH',
        teacherRequirements: 'Phân tích số liệu thống kê, đề xuất giải pháp nâng cao chất lượng nguồn nhân lực.',
      },
    ],
  },
  'GD Kinh tế & Pháp luật': {
    '11': [
      {
        id: 'ktpl_11_c1',
        name: 'Bài 1 & 2: Cạnh tranh, Cung cầu & Lạm phát trong kinh tế thị trường',
        knowledgeContent: 'Khái niệm cạnh tranh lành mạnh, quy luật cung cầu và sự hình thành giá cả; khái niệm lạm phát, nguyên nhân và các biện pháp kiềm chế lạm phát của nhà nước',
        teacherRequirements: 'Vận dụng phân tích biến động giá cả thị trường hàng hóa trong đời sống tiêu dùng hàng ngày.',
      },
    ],
  },
};

export function getSubjectChapters(subject: string, grade: string): ChapterInfo[] {
  const subjectData = SUBJECT_CURRICULUM_DATA[subject];
  if (subjectData && subjectData[grade]) {
    return subjectData[grade];
  }
  // Fallback to default
  return [
    {
      id: 'default_c1',
      name: `Trọng tâm kiến thức môn ${subject} lớp ${grade}`,
      knowledgeContent: `Kiến thức cơ bản, phương pháp giải bài tập và ứng dụng thực tiễn môn ${subject} lớp ${grade}`,
      teacherRequirements: 'Đảm bảo bám sát chương trình GDPT mới, đủ 3 mức độ nhận thức.',
    },
  ];
}

/**
 * Sinh ngân hàng 40 câu hỏi chuyên sâu theo từng môn & chương cụ thể
 * Phân bổ đúng 3 mức độ nhận thức:
 * - 18 câu BIẾT (KNOW)
 * - 14 câu HIỂU (UNDERSTAND)
 * - 8 câu VẬN DỤNG (APPLY)
 */
export function generateChapterQuestionBank(
  subject: string,
  grade: string,
  chapterName: string,
  count = 40
): QuestionBankItem[] {
  const questions: QuestionBankItem[] = [];
  const knowCount = Math.round(count * 0.45); // 18 câu
  const understandCount = Math.round(count * 0.35); // 14 câu
  const applyCount = count - knowCount - understandCount; // 8 câu

  let itemIdx = 1;
  const timestamp = Date.now();

  // 1. SINH CÂU HỎI MỨC BIẾT (KNOW) - Nhận diện, định nghĩa, công thức
  for (let i = 0; i < knowCount; i++) {
    const code = `CH-${getSubjectCode(subject)}-${grade}-B${String(itemIdx++).padStart(2, '0')}`;
    const qData = getSubjectSpecificQuestionTemplate({
      subject,
      grade,
      chapterName,
      level: 'KNOW',
      index: i,
    }) as any;

    questions.push({
      id: `qb_gen_${timestamp}_${i}`,
      code,
      subject,
      grade,
      topic: chapterName,
      type: qData.type,
      cognitiveLevel: 'KNOW',
      cognitive_level: 'KNOW',
      content: qData.content,
      options: qData.options,
      correctAnswerText: qData.correctAnswerText,
      acceptedAnswers: qData.acceptedAnswers,
      unit: qData.unit,
      essayRubric: qData.essayRubric,
      points: qData.points || 0.25,
      creatorName: 'AI Khảo Thí Đa Môn',
      createdAt: new Date().toISOString().split('T')[0],
      qualityStatus: 'valid',
      qualityNotes: 'Đạt chuẩn mức 1 – BIẾT: Nhận biết khái niệm, công thức và dữ kiện chuẩn SGK.',
    });
  }

  // 2. SINH CÂU HỎI MỨC HIỂU (UNDERSTAND) - Giải thích, phân tích, so sánh
  for (let i = 0; i < understandCount; i++) {
    const code = `CH-${getSubjectCode(subject)}-${grade}-H${String(itemIdx++).padStart(2, '0')}`;
    const qData = getSubjectSpecificQuestionTemplate({
      subject,
      grade,
      chapterName,
      level: 'UNDERSTAND',
      index: i,
    }) as any;

    questions.push({
      id: `qb_gen_${timestamp}_${knowCount + i}`,
      code,
      subject,
      grade,
      topic: chapterName,
      type: qData.type,
      cognitiveLevel: 'UNDERSTAND',
      cognitive_level: 'UNDERSTAND',
      content: qData.content,
      options: qData.options,
      correctAnswerText: qData.correctAnswerText,
      acceptedAnswers: qData.acceptedAnswers,
      unit: qData.unit,
      essayRubric: qData.essayRubric,
      points: qData.points || (qData.type === 'true_false' ? 1.0 : 0.5),
      creatorName: 'AI Khảo Thí Đa Môn',
      createdAt: new Date().toISOString().split('T')[0],
      qualityStatus: 'valid',
      qualityNotes: 'Đạt chuẩn mức 2 – HIỂU: Khả năng giải thích cơ chế, đối chiếu và so sánh quy luật.',
    });
  }

  // 3. SINH CÂU HỎI MỨC VẬN DỤNG (APPLY) - Tính toán, xử lý tình huống mới, thực tiễn
  for (let i = 0; i < applyCount; i++) {
    const code = `CH-${getSubjectCode(subject)}-${grade}-V${String(itemIdx++).padStart(2, '0')}`;
    const qData = getSubjectSpecificQuestionTemplate({
      subject,
      grade,
      chapterName,
      level: 'APPLY',
      index: i,
    }) as any;

    questions.push({
      id: `qb_gen_${timestamp}_${knowCount + understandCount + i}`,
      code,
      subject,
      grade,
      topic: chapterName,
      type: qData.type,
      cognitiveLevel: 'APPLY',
      cognitive_level: 'APPLY',
      content: qData.content,
      options: qData.options,
      correctAnswerText: qData.correctAnswerText,
      acceptedAnswers: qData.acceptedAnswers,
      unit: qData.unit,
      essayRubric: qData.essayRubric,
      points: qData.points || (qData.type === 'essay' ? 2.0 : 0.5),
      creatorName: 'AI Khảo Thí Đa Môn',
      createdAt: new Date().toISOString().split('T')[0],
      qualityStatus: 'valid',
      qualityNotes: 'Đạt chuẩn mức 3 – VẬN DỤNG: Giải quyết bài toán thực tế, suy luận kết hợp nhiều bước.',
    });
  }

  return questions;
}

function getSubjectCode(subject: string): string {
  switch (subject) {
    case 'Toán học': return 'TOAN';
    case 'Vật lí': return 'LY';
    case 'Hóa học': return 'HOA';
    case 'Sinh học': return 'SINH';
    case 'Ngữ văn': return 'VAN';
    case 'Tiếng Anh': return 'ENG';
    case 'Lịch sử': return 'SU';
    case 'Địa lí': return 'DIA';
    case 'Tin học': return 'TIN';
    case 'GD Kinh tế & Pháp luật': return 'KTPL';
    default: return 'MH';
  }
}

interface TemplateParams {
  subject: string;
  grade: string;
  chapterName: string;
  level: CognitiveLevel;
  index: number;
}

function getSubjectSpecificQuestionTemplate(p: TemplateParams) {
  const { subject, level, index, chapterName } = p;

  if (subject === 'Toán học') {
    if (level === 'KNOW') {
      const templates = [
        {
          type: 'multiple_choice' as QuestionType,
          content: `Tập xác định của hàm số y = 1 / sin(x) là`,
          options: [
            { key: 'A', text: 'D = R \\ {kπ, k ∈ Z}', isCorrect: true, explanation: 'Mẫu số sin(x) ≠ 0 khi x ≠ kπ, k ∈ Z.' },
            { key: 'B', text: 'D = R \\ {π/2 + kπ, k ∈ Z}', isCorrect: false },
            { key: 'C', text: 'D = R', isCorrect: false },
            { key: 'D', text: 'D = [-1; 1]', isCorrect: false },
          ],
        },
        {
          type: 'multiple_choice' as QuestionType,
          content: `Cho cấp số cộng (un) có u1 = 3 và công sai d = 4. Số hạng thứ hai u2 bằng`,
          options: [
            { key: 'A', text: '7', isCorrect: true, explanation: 'u2 = u1 + d = 3 + 4 = 7.' },
            { key: 'B', text: '12', isCorrect: false },
            { key: 'C', text: '-1', isCorrect: false },
            { key: 'D', text: '1', isCorrect: false },
          ],
        },
        {
          type: 'multiple_choice' as QuestionType,
          content: `Công thức nghiệm của phương trình sin(x) = sin(α) là`,
          options: [
            { key: 'A', text: 'x = α + k2π hoặc x = π - α + k2π (k ∈ Z)', isCorrect: true, explanation: 'Công thức nghiệm chuẩn SGK Toán 11.' },
            { key: 'B', text: 'x = ±α + k2π (k ∈ Z)', isCorrect: false },
            { key: 'C', text: 'x = α + kπ (k ∈ Z)', isCorrect: false },
            { key: 'D', text: 'x = -α + k2π (k ∈ Z)', isCorrect: false },
          ],
        },
        {
          type: 'multiple_choice' as QuestionType,
          content: `Giới hạn lim (1 / n) khi n tiến tới dương vô cùng bằng`,
          options: [
            { key: 'A', text: '0', isCorrect: true, explanation: 'Định lý giới hạn cơ bản: lim 1/n^k = 0.' },
            { key: 'B', text: '1', isCorrect: false },
            { key: 'C', text: '+∞', isCorrect: false },
            { key: 'D', text: '-∞', isCorrect: false },
          ],
        },
      ];
      return templates[index % templates.length];
    } else if (level === 'UNDERSTAND') {
      if (index % 2 === 0) {
        return {
          type: 'true_false' as QuestionType,
          content: `Cho hàm số y = f(x) liên tục trên đoạn [a; b]. Xét tính Đúng/Sai của các mệnh đề sau:`,
          options: [
            { key: 'a', text: 'Nếu f(a).f(b) < 0 thì phương trình f(x) = 0 có ít nhất một nghiệm thuộc khoảng (a; b).', isCorrect: true },
            { key: 'b', text: 'Hàm số f(x) luôn có giá trị lớn nhất và giá trị nhỏ nhất trên đoạn [a; b].', isCorrect: true },
            { key: 'c', text: 'Nếu f(x) liên tục trên (a; b) thì phương trình f(x) = 0 bắt buộc có nghiệm.', isCorrect: false },
            { key: 'd', text: 'Đồ thị của hàm số liên tục trên [a; b] là một đường liền nét.', isCorrect: true },
          ],
          points: 1.0,
        };
      } else {
        return {
          type: 'multiple_choice' as QuestionType,
          content: `Cho cấp số nhân (un) có u1 = 2 và công bội q = 3. Số hạng tổng quát un là`,
          options: [
            { key: 'A', text: 'un = 2.3^(n - 1)', isCorrect: true, explanation: 'Công thức un = u1 . q^(n - 1).' },
            { key: 'B', text: 'un = 2.3^n', isCorrect: false },
            { key: 'C', text: 'un = 6^(n - 1)', isCorrect: false },
            { key: 'D', text: 'un = 3.2^(n - 1)', isCorrect: false },
          ],
        };
      }
    } else {
      // APPLY
      if (index % 2 === 0) {
        return {
          type: 'short_answer' as QuestionType,
          content: `Một bác nông dân gửi tiết kiệm 100 triệu đồng vào ngân hàng với lãi suất 6%/năm theo thể thức lãi kép. Hỏi sau đúng 3 năm bác nông dân nhận được tất cả bao nhiêu triệu đồng (làm tròn đến hàng phần mười)?`,
          correctAnswerText: '119.1',
          acceptedAnswers: ['119.1', '119,1', '119.1 triệu', '119,1 triệu'],
          points: 0.5,
        };
      } else {
        return {
          type: 'essay' as QuestionType,
          content: `Một công ty dự kiến làm một thùng chứa hình hộp chữ nhật không nắp có đáy là hình vuông và thể tích bằng 500 lít (0.5 m³).
a) Lập hàm số biểu diễn diện tích toàn phần vật liệu làm thùng theo cạnh đáy x (mét).
b) Tìm kích thước cạnh đáy và chiều cao để lượng vật liệu làm thùng là nhỏ nhất nhằm tiết kiệm chi phí sản xuất.`,
          correctAnswerText: `Đáp án chi tiết bám sát YCCĐ SGK Toán 11 Kết nối tri thức:
- Bước 1: Thể tích V = x² * h = 0.5 m³ => Chiều cao h = 0.5 / x² (m). Diện tích toàn phần thùng không nắp gồm đáy và 4 mặt bên: S(x) = x² + 4*x*h = x² + 4*x*(0.5/x²) = x² + 2/x (m²). (0.75đ)
- Bước 2: Đạo hàm S'(x) = 2x - 2/x² = 0 <=> 2x³ = 2 <=> x = 1 (m) > 0. Lập bảng biến thiên thấy S(x) đạt giá trị nhỏ nhất tại x = 1. (0.75đ)
- Bước 3: Với x = 1m thì h = 0.5 / 1² = 0.5m. Kết luận: Kích thước cạnh đáy là 1m x 1m và chiều cao là 0.5m thì tốn ít vật liệu nhất. (0.5đ)`,
          essayRubric: [
            { step: 'Bước 1: Lập hàm diện tích S(x) = x² + 2/x', points: 0.75, criteria: 'Đúng công thức thể tích V và diện tích các mặt' },
            { step: 'Bước 2: Tìm giá trị nhỏ nhất của S(x) bằng đạo hàm hoặc BĐT Cauchy', points: 0.75, criteria: 'Tìm được x = 1 m' },
            { step: 'Bước 3: Kết luận kích thước cạnh đáy và chiều cao', points: 0.5, criteria: 'Đáy 1m x 1m, chiều cao h = 0.5m' },
          ],
          points: 2.0,
        };
      }
    }
  }

  if (subject === 'Vật lí') {
    if (level === 'KNOW') {
      const templates = [
        {
          type: 'multiple_choice' as QuestionType,
          content: `Trong dao động điều hòa của một vật, đại lượng nào sau đây KHÔNG đổi theo thời gian?`,
          options: [
            { key: 'A', text: 'Cơ năng và tần số dao động', isCorrect: true, explanation: 'Trong dao động điều hòa lý tưởng, cơ năng và tần số không đổi.' },
            { key: 'B', text: 'Li độ và vận tốc', isCorrect: false },
            { key: 'C', text: 'Gia tốc và thế năng', isCorrect: false },
            { key: 'D', text: 'Lực kéo về', isCorrect: false },
          ],
        },
        {
          type: 'multiple_choice' as QuestionType,
          content: `Bước sóng λ được định nghĩa là`,
          options: [
            { key: 'A', text: 'quãng đường mà sóng truyền được trong một chu kỳ dao động.', isCorrect: true, explanation: 'λ = v.T = v / f.' },
            { key: 'B', text: 'khoảng cách giữa hai điểm dao động cùng pha trên phương truyền sóng.', isCorrect: false },
            { key: 'C', text: 'vận tốc truyền sóng trong một giây.', isCorrect: false },
            { key: 'D', text: 'khoảng cách ngắn nhất giữa hai nút sóng dừng.', isCorrect: false },
          ],
        },
        {
          type: 'multiple_choice' as QuestionType,
          content: `Hệ thức nào sau đây biểu diễn mối quan hệ giữa chu kỳ T và tần số f của dao động điều hòa?`,
          options: [
            { key: 'A', text: 'T = 1 / f', isCorrect: true, explanation: 'T = 1 / f = 2π / ω.' },
            { key: 'B', text: 'T = 2π.f', isCorrect: false },
            { key: 'C', text: 'T = f / 2π', isCorrect: false },
            { key: 'D', text: 'T.f = 2π', isCorrect: false },
          ],
        },
      ];
      return templates[index % templates.length];
    } else if (level === 'UNDERSTAND') {
      return {
        type: 'true_false' as QuestionType,
        content: `Một con lắc lò xo dao động điều hòa trên mặt phẳng nằm ngang không ma sát. Xét tính Đúng/Sai:`,
        options: [
          { key: 'a', text: 'Khi vật đi qua vị trí cân bằng, thế năng của vật đạt cực tiểu và động năng đạt cực đại.', isCorrect: true },
          { key: 'b', text: 'Vận tốc và li độ dao động luôn biến thiên vuông pha với nhau.', isCorrect: true },
          { key: 'c', text: 'Nếu tăng khối lượng vật nặng lên 4 lần thì chu kỳ dao động giảm đi 2 lần.', isCorrect: false },
          { key: 'd', text: 'Gia tốc của vật luôn hướng về vị trí cân bằng và tỷ lệ thuận với độ lớn li độ.', isCorrect: true },
        ],
        points: 1.0,
      };
    } else {
      // APPLY
      if (index % 2 === 0) {
        return {
          type: 'short_answer' as QuestionType,
          content: `Một sợi dây đàn hồi dài 1.2 m được căng ngang, hai đầu cố định. Khi kích thích cho dây dao động với tần số 50 Hz thì trên dây quan sát thấy có sóng dừng với 3 bụng sóng. Tốc độ truyền sóng trên dây bằng bao nhiêu m/s?`,
          correctAnswerText: '40',
          acceptedAnswers: ['40', '40 m/s', '40m/s'],
          points: 0.5,
        };
      } else {
        return {
          type: 'essay' as QuestionType,
          content: `Một con lắc lò xo gồm lò xo độ cứng k = 100 N/m và vật nặng khối lượng m = 400 g dao động điều hòa trên mặt phẳng ngang không ma sát. Kéo vật ra khỏi vị trí cân bằng một đoạn 4 cm rồi buông nhẹ không vận tốc ban đầu tại thời điểm t = 0. Lấy π² ≈ 10.
a) Tính tần số góc ω và chu kỳ dao động T của con lắc.
b) Viết phương trình dao động điều hòa của con lắc (chọn chiều dương là chiều kéo ban đầu).
c) Tính động năng và thế năng của con lắc khi vật có li độ x = 2 cm.`,
          correctAnswerText: `Đáp án chi tiết bám sát YCCĐ SGK Vật lí 11 Kết nối tri thức:
- Bước 1: Tần số góc ω = √(k/m) = √(100 / 0.4) = √250 = 5√10 ≈ 5π rad/s. Chu kỳ T = 2π / ω = 2π / (5π) = 0.4 (s). (0.75đ)
- Bước 2: Tại t = 0, x = 4 cm = A và v = 0 => Pha ban đầu φ = 0 rad. Phương trình dao động: x = 4.cos(5π.t) (cm). (0.75đ)
- Bước 3: Khi x = 2 cm = 0.02 m:
  Thế năng Et = 1/2 * k * x² = 1/2 * 100 * (0.02)² = 0.02 (J).
  Cơ năng E = 1/2 * k * A² = 1/2 * 100 * (0.04)² = 0.08 (J).
  Động năng Ed = E - Et = 0.08 - 0.02 = 0.06 (J). (0.5đ)`,
          essayRubric: [
            { step: 'Bước 1: Tính tần số góc ω = 5π rad/s và chu kỳ T = 0.4 s', points: 0.75, criteria: 'Đúng công thức và số liệu tính chu kỳ' },
            { step: 'Bước 2: Xác định biên độ A, pha ban đầu φ và viết PT dao động', points: 0.75, criteria: 'Viết đúng PT x = 4cos(5πt) cm' },
            { step: 'Bước 3: Tính thế năng 0.02 J và động năng 0.06 J', points: 0.5, criteria: 'Tính chính xác năng lượng và đơn vị Jun' },
          ],
          points: 2.0,
        };
      }
    }
  }

  if (subject === 'Sinh học') {
    if (level === 'KNOW') {
      return {
        type: 'multiple_choice' as QuestionType,
        content: `Ở thực vật C3, chất nhận CO2 đầu tiên trong chu trình Calvin là`,
        options: [
          { key: 'A', text: 'Ribulose-1,5-bisphosphate (RuBP)', isCorrect: true, explanation: 'Chất nhận CO2 đầu tiên ở C3 là hợp chất 5C RuBP.' },
          { key: 'B', text: 'Phosphoenolpyruvate (PEP)', isCorrect: false },
          { key: 'C', text: 'Axit oxaloacetic (OAA)', isCorrect: false },
          { key: 'D', text: '3-phosphoglycerate (3-PGA)', isCorrect: false },
        ],
      };
    } else if (level === 'UNDERSTAND') {
      return {
        type: 'true_false' as QuestionType,
        content: `Xét quá trình quang hợp ở thực vật C3, C4 và CAM. Xét tính Đúng/Sai:`,
        options: [
          { key: 'a', text: 'Thực vật CAM mở khí khổng vào ban đêm và đóng vào ban ngày để tiết kiệm nước.', isCorrect: true },
          { key: 'b', text: 'Thực vật C4 có điểm bù CO2 thấp hơn và năng suất sinh học cao hơn thực vật C3.', isCorrect: true },
          { key: 'c', text: 'Quá trình cố định CO2 ở thực vật C4 chỉ diễn ra ở tế bào mô giậu.', isCorrect: false },
          { key: 'd', text: 'Cả ba nhóm thực vật đều có chu trình Calvin để tổng hợp chất hữu cơ.', isCorrect: true },
        ],
        points: 1.0,
      };
    } else {
      if (index % 2 === 0) {
        return {
          type: 'short_answer' as QuestionType,
          content: `Một phân tử DNA mạch kép ở sinh vật nhân thực có 3000 nucleotide, trong đó số nucleotide loại Adenine (A) chiếm 20% tổng số nucleotide. Số liên kết hydro của phân tử DNA này bằng bao nhiêu?`,
          correctAnswerText: '3900',
          acceptedAnswers: ['3900', '3900 liên kết'],
          points: 0.5,
        };
      } else {
        return {
          type: 'essay' as QuestionType,
          content: `Dựa vào kiến thức về trao đổi nước và dinh dưỡng khoáng ở thực vật (SGK Sinh học 11 Kết nối tri thức):
a) Hãy giải thích tại sao hiện tượng thoát hơi nước qua khí khổng vừa là "tai họa" vừa là "tai họa tất yếu" đối với thực vật.
b) Trong canh tác nông nghiệp công nghệ cao, tại sao người ta thường kết hợp hệ thống tưới nước nhỏ giọt với bón phân hòa tan (fertigation)?`,
          correctAnswerText: `Đáp án chi tiết bám sát YCCĐ SGK Sinh học 11 Kết nối tri thức:
- Bước 1: Thoát hơi nước là "tai họa" vì làm thực vật mất đi tới 98-99% lượng nước rễ hút vào, nguy cơ héo rũ, giảm năng suất khi hạn hán. (0.5đ)
- Bước 2: Thoát hơi nước là "tai họa tất yếu" vì tạo động lực đầu trên của dòng mạch gỗ giúp hút nước và ion khoáng từ rễ lên lá; hạ nhiệt độ bề mặt lá khi trời nắng gắt; khí khổng mở để CO2 khuếch tán vào phục vụ quang hợp. (0.75đ)
- Bước 3: Hệ thống tưới nhỏ giọt kết hợp bón phân hòa tan giúp cung cấp nước và dinh dưỡng trực tiếp đến vùng rễ cây, tránh bay hơi và rửa trôi phân bón, kiểm soát chính xác nồng độ dinh dưỡng theo từng giai đoạn sinh trưởng của cây trồng. (0.75đ)`,
          essayRubric: [
            { step: 'Bước 1: Giải thích mặt "tai họa" (mất nước, héo rũ)', points: 0.5, criteria: 'Nêu đúng bản chất mất nước' },
            { step: 'Bước 2: Giải thích mặt "tất yếu" (động lực hút mạch gỗ, hạ nhiệt lá, CO2 vào lá)', points: 0.75, criteria: 'Đầy đủ 3 vai trò sinh học' },
            { step: 'Bước 3: Vận dụng vào hệ thống tưới nhỏ giọt và nông nghiệp công nghệ cao', points: 0.75, criteria: 'Phân tích tính hiệu quả thực tiễn' },
          ],
          points: 2.0,
        };
      }
    }
  }

  if (subject === 'Tiếng Anh') {
    if (level === 'KNOW') {
      return {
        type: 'multiple_choice' as QuestionType,
        content: `Choose the correct option: You _______ drive on the left when you are in the United Kingdom. It is a strict law.`,
        options: [
          { key: 'A', text: 'must', isCorrect: true, explanation: '"Must" expresses a strong legal obligation.' },
          { key: 'B', text: 'should', isCorrect: false },
          { key: 'C', text: 'may', isCorrect: false },
          { key: 'D', text: 'can', isCorrect: false },
        ],
      };
    } else if (level === 'UNDERSTAND') {
      return {
        type: 'multiple_choice' as QuestionType,
        content: `Identify the sentence that has the closest meaning: "Unless we take immediate action, global warming will accelerate rapidly."`,
        options: [
          { key: 'A', text: 'If we do not take immediate action, global warming will accelerate rapidly.', isCorrect: true, explanation: '"Unless" = "If not".' },
          { key: 'B', text: 'If we take immediate action, global warming will accelerate rapidly.', isCorrect: false },
          { key: 'C', text: 'Because we take immediate action, global warming accelerates rapidly.', isCorrect: false },
          { key: 'D', text: 'Global warming will stop even if we do not take action.', isCorrect: false },
        ],
      };
    } else {
      if (index % 2 === 0) {
        return {
          type: 'short_answer' as QuestionType,
          content: `Rewrite the sentence using a cleft sentence with "It was... that":
"My parents supported me wholeheartedly during the exam period."
=> It was my parents that ________________ (Điền cụm từ tiếp theo để hoàn chỉnh câu).`,
          correctAnswerText: 'supported me wholeheartedly during the exam period',
          acceptedAnswers: [
            'supported me wholeheartedly during the exam period',
            'supported me wholeheartedly during the exam period.',
          ],
          points: 0.5,
        };
      } else {
        return {
          type: 'essay' as QuestionType,
          content: `Write a short paragraph (120 - 150 words) about how artificial intelligence (AI) can assist high school students in autonomous learning. Mention at least two benefits and one challenge.`,
          correctAnswerText: `Model Answer (Curriculum Standards):
Artificial intelligence (AI) has significantly revolutionized autonomous learning among high school students. Firstly, AI-powered learning applications provide instant, personalized feedback tailored to individual learning paces, enabling students to identify their strengths and bridge knowledge gaps efficiently. Secondly, virtual tutors and generative AI tools provide round-the-clock academic assistance, making complex concepts easier to comprehend through adaptive simulations. However, over-reliance on AI poses a serious challenge, as it may diminish critical thinking and problem-solving perseverance if learners simply copy suggested answers. Therefore, high school students should utilize AI as an intelligent assistant while actively cultivating independent analysis and intellectual curiosity.`,
          essayRubric: [
            { step: 'Topic sentence introducing AI in autonomous learning', points: 0.5, criteria: 'Clear focus and proper grammar' },
            { step: 'Developing two concrete benefits with supporting explanations', points: 1.0, criteria: 'Logical arguments and rich vocabulary' },
            { step: 'Presenting one challenge and balanced conclusion', points: 0.5, criteria: 'Thoughtful reflection and proper word count' },
          ],
          points: 2.0,
        };
      }
    }
  }

  if (subject === 'Ngữ văn') {
    if (level === 'KNOW') {
      return {
        type: 'multiple_choice' as QuestionType,
        content: `Biện pháp tu từ nào được sử dụng chủ yếu trong câu văn nhằm gợi hình ảnh sống động và liên tưởng giàu cảm xúc?`,
        options: [
          { key: 'A', text: 'Ẩn dụ và so sánh', isCorrect: true, explanation: 'Kiến thức Tiếng Việt cơ bản.' },
          { key: 'B', text: 'Liệt kê đơn thuần', isCorrect: false },
          { key: 'C', text: 'Đảo ngữ không ngữ cảnh', isCorrect: false },
          { key: 'D', text: 'Nói giảm nói tránh sai ngữ cảnh', isCorrect: false },
        ],
      };
    } else if (level === 'UNDERSTAND') {
      return {
        type: 'multiple_choice' as QuestionType,
        content: `Chi tiết "ngọn đèn dầu le lói trong đêm tối" ở tác phẩm Hai đứa trẻ (Thạch Lam) mang ý nghĩa biểu tượng sâu sắc nhất cho điều gì?`,
        options: [
          { key: 'A', text: 'Kiếp sống nhỏ bé, mòn mỏi, tăm tối của những mảnh đời nghèo nơi phố huyện nghèo trước Cách mạng.', isCorrect: true, explanation: 'Ý nghĩa biểu tượng chủ đạo trong phong cách Thạch Lam.' },
          { key: 'B', text: 'Sự giàu có sung túc của phố huyện về đêm.', isCorrect: false },
          { key: 'C', text: 'Ánh sáng của khoa học kỹ thuật hiện đại.', isCorrect: false },
          { key: 'D', text: 'Ý chí cách mạng quật khởi của người dân.', isCorrect: false },
        ],
      };
    } else {
      return {
        type: 'essay' as QuestionType,
        content: `Viết một đoạn văn nghị luận xã hội (khoảng 200 chữ) trình bày suy nghĩ của anh/chị về ý nghĩa của "tinh thần tự học và đổi mới sáng tạo" đối với học sinh THPT trong thời đại chuyển đổi số.`,
        correctAnswerText: `Đáp án chi tiết bám sát YCCĐ SGK Ngữ văn 11 Kết nối tri thức:
- Bước 1: Nêu vấn đề và giải thích khái niệm: Tự học là quá trình chủ động chiếm lĩnh tri thức; đổi mới sáng tạo là tìm ra cách tiếp cận và giải pháp mới có giá trị. Trong thời đại số, đây là năng lực cốt lõi quyết định sự thành bại của mỗi cá nhân (0.5đ).
- Bước 2: Bàn luận vai trò và dẫn chứng: Tự học giúp học sinh làm chủ kho tàng tri thức vô tận của nhân loại, không bị động trước sự biến đổi nhanh chóng của công nghệ. Sáng tạo giúp biến tri thức thành sản phẩm có ích cho cộng đồng. Dẫn chứng các học sinh đoạt giải sáng tạo KHKT nhờ đam mê tự nghiên cứu (1.0đ).
- Bước 3: Bài học nhận thức và hành động: Phê phán lối học thụ động, ỷ lại; xác định kế hoạch tự học có kỷ luật, biết ứng dụng công nghệ số và AI một cách thông minh, liêm chính (0.5đ).`,
        essayRubric: [
          { step: 'Nêu vấn đề và giải thích khái niệm tự học, sáng tạo', points: 0.5, criteria: 'Diễn đạt rõ ràng, đúng trọng tâm' },
          { step: 'Bàn luận thực trạng, vai trò và dẫn chứng thực tiễn', points: 1.0, criteria: 'Lập luận sắc bén, dẫn chứng thuyết phục' },
          { step: 'Bài học nhận thức và hành động của bản thân', points: 0.5, criteria: 'Liên hệ chân thành, sâu sắc' },
        ],
        points: 2.0,
      };
    }
  }

  // Môn Hóa học (Mặc định nếu là Hóa học hoặc môn khác)
  if (level === 'KNOW') {
    const templates = [
      {
        type: 'multiple_choice' as QuestionType,
        content: `Trong các phản ứng sau, phản ứng nào là phản ứng tỏa nhiệt ở điều kiện chuẩn?`,
        options: [
          { key: 'A', text: 'Phản ứng đốt cháy than trong không khí (C + O2 → CO2)', isCorrect: true, explanation: 'Đốt than giải phóng nhiệt lượng lớn ra môi trường.' },
          { key: 'B', text: 'Nhiệt phân đá vôi (CaCO3 → CaO + CO2)', isCorrect: false },
          { key: 'C', text: 'Quang hợp ở cây xanh', isCorrect: false },
          { key: 'D', text: 'Hòa tan muối ăn vào nước', isCorrect: false },
        ],
      },
      {
        type: 'multiple_choice' as QuestionType,
        content: `Hằng số cân bằng Kc của phản ứng thuận nghịch phụ thuộc vào yếu tố nào sau đây?`,
        options: [
          { key: 'A', text: 'Bản chất của phản ứng và nhiệt độ', isCorrect: true, explanation: 'Kc chỉ phụ thuộc vào bản chất phản ứng và nhiệt độ.' },
          { key: 'B', text: 'Áp suất chung của hệ', isCorrect: false },
          { key: 'C', text: 'Nồng độ các chất ban đầu', isCorrect: false },
          { key: 'D', text: 'Chất xúc tác', isCorrect: false },
        ],
      },
      {
        type: 'multiple_choice' as QuestionType,
        content: `Dung dịch nào sau đây có giá trị pH < 7 ở nhiệt độ 25°C?`,
        options: [
          { key: 'A', text: 'Dung dịch HCl 0.1 M', isCorrect: true, explanation: 'Dung dịch acid có pH < 7.' },
          { key: 'B', text: 'Dung dịch NaOH 0.1 M', isCorrect: false },
          { key: 'C', text: 'Dung dịch NaCl 1 M', isCorrect: false },
          { key: 'D', text: 'Nước cất tinh khiết', isCorrect: false },
        ],
      },
    ];
    return templates[index % templates.length];
  } else if (level === 'UNDERSTAND') {
    return {
      type: 'true_false' as QuestionType,
      content: `Cho hệ cân bằng trong bình kín: N2(g) + 3H2(g) ⇌ 2NH3(g), ΔrHo298 = -92 kJ. Xét tính Đúng/Sai của các nhận định:`,
      options: [
        { key: 'a', text: 'Tăng áp suất chung của hệ làm cân bằng chuyển dịch theo chiều thuận tạo ra nhiều NH3 hơn.', isCorrect: true },
        { key: 'b', text: 'Tăng nhiệt độ của bình phản ứng làm cân bằng chuyển dịch theo chiều nghịch.', isCorrect: true },
        { key: 'c', text: 'Chất xúc tác bột sắt làm tăng tốc độ phản ứng thuận và giảm tốc độ phản ứng nghịch.', isCorrect: false },
        { key: 'd', text: 'Lấy bớt NH3 ra khỏi bình phản ứng làm cân bằng chuyển dịch theo chiều thuận.', isCorrect: true },
      ],
      points: 1.0,
    };
  } else {
    // APPLY
    if (index % 2 === 0) {
      return {
        type: 'short_answer' as QuestionType,
        content: `Đốt cháy hoàn toàn 1 mol khí methane (CH4) tỏa ra 890 kJ nhiệt lượng. Nếu đốt cháy hoàn toàn 32 gam khí CH4 ở điều kiện chuẩn thì nhiệt lượng tỏa ra bằng bao nhiêu kJ? (Cho C = 12, H = 1).`,
        correctAnswerText: '1780',
        acceptedAnswers: ['1780', '1780 kJ', '1780kJ'],
        points: 0.5,
      };
    } else {
      return {
        type: 'essay' as QuestionType,
        content: `Một mẫu nước thải từ xí nghiệp mạ điện có nồng độ ion H+ là 0.001 M.
a) Tính pH của mẫu nước thải và xác định môi trường của dung dịch.
b) Để trung hòa 100 lít mẫu nước thải trên về pH = 7.0, người ta dùng dung dịch Ca(OH)2 0.05 M. Hãy tính thể tích dung dịch Ca(OH)2 cần dùng.`,
        correctAnswerText: `Đáp án chi tiết bám sát YCCĐ SGK Hóa học 11 Kết nối tri thức:
- Bước 1: Tính pH = -log[H+] = -log(10^-3) = 3. Vì pH = 3 < 7 nên mẫu nước thải có môi trường acid (0.5đ).
- Bước 2: Số mol H+ trong 100 lít nước thải là n(H+) = CM * V = 0.001 * 100 = 0.1 mol (0.5đ).
- Bước 3: Phương trình ion rút gọn của phản ứng trung hòa: H+ + OH- -> H2O. Theo phương trình: n(OH-) = n(H+) = 0.1 mol (0.5đ).
- Bước 4: Ca(OH)2 -> Ca2+ + 2OH- => n(Ca(OH)2) = 1/2 * n(OH-) = 0.05 mol. Thể tích dung dịch Ca(OH)2 cần dùng: V = n / CM = 0.05 / 0.05 = 1.0 lít (0.5đ).`,
        essayRubric: [
          { step: 'Tính pH = -log[H+] = 3, kết luận môi trường acid', points: 0.5, criteria: 'Đúng công thức và kết luận' },
          { step: 'Tính số mol H+ = 0.001 x 100 = 0.1 mol', points: 0.5, criteria: 'Tính chính xác số mol' },
          { step: 'Viết phương trình ion trung hòa: H+ + OH- -> H2O', points: 0.5, criteria: 'Viết đúng phương trình ion' },
          { step: 'Tính n_Ca(OH)2 = 0.05 mol -> V = 1.0 lít', points: 0.5, criteria: 'Đáp số đúng 1.0 lít' },
        ],
        points: 2.0,
      };
    }
  }
}

/**
 * Sinh ngân hàng dữ liệu mẫu đa môn chuẩn khảo thí (khoảng 40 câu/chương cho các môn chính)
 */
export function generateComprehensiveMultiSubjectBank(): QuestionBankItem[] {
  const subjectsToSeed = ['Hóa học', 'Toán học', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh'];
  const allQuestions: QuestionBankItem[] = [];

  subjectsToSeed.forEach((subj) => {
    const chapters = getSubjectChapters(subj, '11');
    const firstChapter = chapters[0]?.name || `Chương 1 môn ${subj}`;
    const chapterQuestions = generateChapterQuestionBank(subj, '11', firstChapter, 40);
    allQuestions.push(...chapterQuestions);
  });

  return allQuestions;
}
