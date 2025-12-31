import { generate } from '@pdfme/generator';
import { text, line, rectangle } from '@pdfme/schemas';
import type { Template, Font } from '@pdfme/common';
import { readFileSync } from 'fs';
import { join } from 'path';

// 日本語フォントを読み込み
let japaneseFontData: ArrayBuffer | null = null;

function getJapaneseFont(): Font {
	if (!japaneseFontData) {
		try {
			// staticディレクトリからフォントを読み込み
			const fontPath = join(process.cwd(), 'static', 'fonts', 'NotoSansJP-Regular.ttf');
			const fontBuffer = readFileSync(fontPath);
			japaneseFontData = fontBuffer.buffer.slice(
				fontBuffer.byteOffset,
				fontBuffer.byteOffset + fontBuffer.byteLength
			);
		} catch (e) {
			console.error('Failed to load Japanese font:', e);
		}
	}

	return {
		NotoSansJP: {
			data: japaneseFontData || new ArrayBuffer(0),
			fallback: true
		}
	};
}

// 療養計画書のデータ型
export interface CarePlanPdfData {
	// 患者情報
	patientName: string;
	patientNumber: string;
	birthDate: string;
	age: number;
	gender: string;

	// 基本情報
	planType: 'initial' | 'continuous';
	sequenceNumber: number;
	recordDate: string;
	consultationDate: string;

	// 主病
	hasDiabetes: boolean;
	hasHypertension: boolean;
	hasHyperlipidemia: boolean;

	// 検査項目
	height: string | null;
	weightCurrent: string | null;
	weightTarget: string | null;
	bmi: string | null;
	waistCurrent: string | null;
	waistTarget: string | null;
	bloodPressureSystolic: number | null;
	bloodPressureDiastolic: number | null;

	// 血液検査
	bloodTestDate: string | null;
	bloodGlucose: number | null;
	hba1cCurrent: string | null;
	hba1cTarget: string | null;
	totalCholesterol: number | null;
	triglycerides: number | null;
	hdlCholesterol: number | null;
	ldlCholesterol: number | null;

	// 目標
	achievementGoal: string | null;
	behaviorGoal: string | null;

	// 継続用
	goalAchievementStatus: string | null;
	nextGoal: string | null;

	// 署名
	patientSignature: string | null;
	primaryDoctorName: string | null;
	secondaryDoctorName: string | null;

	// 病院情報
	hospitalName: string;
}

// A4サイズ（mm）
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// pdfmeのスキーマプラグイン
const plugins = { text, line, rectangle };

// 初回用テンプレート（様式9）のスキーマ定義
function createInitialTemplate(): Template {
	return {
		basePdf: { width: A4_WIDTH, height: A4_HEIGHT, padding: [10, 10, 10, 10] },
		schemas: [
			[
				// タイトル
				{
					name: 'title',
					type: 'text',
					position: { x: 60, y: 10 },
					width: 90,
					height: 10,
					fontSize: 14,
					fontWeight: 'bold',
					alignment: 'center'
				},
				// 患者情報セクション
				{
					name: 'patientInfoLabel',
					type: 'text',
					position: { x: 10, y: 25 },
					width: 30,
					height: 6,
					fontSize: 9
				},
				{
					name: 'patientName',
					type: 'text',
					position: { x: 40, y: 25 },
					width: 50,
					height: 6,
					fontSize: 10
				},
				{
					name: 'patientNumberLabel',
					type: 'text',
					position: { x: 95, y: 25 },
					width: 25,
					height: 6,
					fontSize: 9
				},
				{
					name: 'patientNumber',
					type: 'text',
					position: { x: 120, y: 25 },
					width: 35,
					height: 6,
					fontSize: 10
				},
				{
					name: 'birthDateLabel',
					type: 'text',
					position: { x: 160, y: 25 },
					width: 20,
					height: 6,
					fontSize: 9
				},
				{
					name: 'birthDateAge',
					type: 'text',
					position: { x: 180, y: 25 },
					width: 25,
					height: 6,
					fontSize: 9
				},
				// 診療日
				{
					name: 'consultationDateLabel',
					type: 'text',
					position: { x: 10, y: 33 },
					width: 20,
					height: 6,
					fontSize: 9
				},
				{
					name: 'consultationDate',
					type: 'text',
					position: { x: 30, y: 33 },
					width: 40,
					height: 6,
					fontSize: 10
				},
				// 主病
				{
					name: 'mainDiseaseLabel',
					type: 'text',
					position: { x: 75, y: 33 },
					width: 15,
					height: 6,
					fontSize: 9
				},
				{
					name: 'diseases',
					type: 'text',
					position: { x: 90, y: 33 },
					width: 80,
					height: 6,
					fontSize: 9
				},
				// 区切り線
				{
					name: 'line1',
					type: 'line',
					position: { x: 10, y: 42 },
					width: 190,
					height: 0.5,
					color: '#000000'
				},
				// 検査項目セクション
				{
					name: 'examSectionLabel',
					type: 'text',
					position: { x: 10, y: 45 },
					width: 40,
					height: 6,
					fontSize: 10,
					fontWeight: 'bold'
				},
				// 身長・体重
				{
					name: 'heightLabel',
					type: 'text',
					position: { x: 10, y: 53 },
					width: 15,
					height: 5,
					fontSize: 8
				},
				{
					name: 'height',
					type: 'text',
					position: { x: 25, y: 53 },
					width: 20,
					height: 5,
					fontSize: 9
				},
				{
					name: 'weightLabel',
					type: 'text',
					position: { x: 50, y: 53 },
					width: 15,
					height: 5,
					fontSize: 8
				},
				{
					name: 'weightCurrent',
					type: 'text',
					position: { x: 65, y: 53 },
					width: 20,
					height: 5,
					fontSize: 9
				},
				{
					name: 'weightTargetLabel',
					type: 'text',
					position: { x: 90, y: 53 },
					width: 20,
					height: 5,
					fontSize: 8
				},
				{
					name: 'weightTarget',
					type: 'text',
					position: { x: 110, y: 53 },
					width: 20,
					height: 5,
					fontSize: 9
				},
				{
					name: 'bmiLabel',
					type: 'text',
					position: { x: 135, y: 53 },
					width: 15,
					height: 5,
					fontSize: 8
				},
				{
					name: 'bmi',
					type: 'text',
					position: { x: 150, y: 53 },
					width: 15,
					height: 5,
					fontSize: 9
				},
				// 血圧
				{
					name: 'bpLabel',
					type: 'text',
					position: { x: 10, y: 60 },
					width: 15,
					height: 5,
					fontSize: 8
				},
				{
					name: 'bloodPressure',
					type: 'text',
					position: { x: 25, y: 60 },
					width: 35,
					height: 5,
					fontSize: 9
				},
				// 血液検査
				{
					name: 'bloodTestLabel',
					type: 'text',
					position: { x: 65, y: 60 },
					width: 25,
					height: 5,
					fontSize: 8
				},
				{
					name: 'bloodTestDate',
					type: 'text',
					position: { x: 90, y: 60 },
					width: 30,
					height: 5,
					fontSize: 9
				},
				// HbA1c
				{
					name: 'hba1cLabel',
					type: 'text',
					position: { x: 10, y: 67 },
					width: 20,
					height: 5,
					fontSize: 8
				},
				{
					name: 'hba1cCurrent',
					type: 'text',
					position: { x: 30, y: 67 },
					width: 15,
					height: 5,
					fontSize: 9
				},
				{
					name: 'hba1cTargetLabel',
					type: 'text',
					position: { x: 50, y: 67 },
					width: 20,
					height: 5,
					fontSize: 8
				},
				{
					name: 'hba1cTarget',
					type: 'text',
					position: { x: 70, y: 67 },
					width: 15,
					height: 5,
					fontSize: 9
				},
				// 脂質
				{
					name: 'cholesterolLabel',
					type: 'text',
					position: { x: 90, y: 67 },
					width: 30,
					height: 5,
					fontSize: 8
				},
				{
					name: 'totalCholesterol',
					type: 'text',
					position: { x: 120, y: 67 },
					width: 20,
					height: 5,
					fontSize: 9
				},
				{
					name: 'triglyceridesLabel',
					type: 'text',
					position: { x: 145, y: 67 },
					width: 25,
					height: 5,
					fontSize: 8
				},
				{
					name: 'triglycerides',
					type: 'text',
					position: { x: 170, y: 67 },
					width: 20,
					height: 5,
					fontSize: 9
				},
				// 区切り線
				{
					name: 'line2',
					type: 'line',
					position: { x: 10, y: 75 },
					width: 190,
					height: 0.5,
					color: '#000000'
				},
				// 達成目標
				{
					name: 'achievementGoalLabel',
					type: 'text',
					position: { x: 10, y: 78 },
					width: 30,
					height: 6,
					fontSize: 10,
					fontWeight: 'bold'
				},
				{
					name: 'achievementGoal',
					type: 'text',
					position: { x: 10, y: 85 },
					width: 190,
					height: 20,
					fontSize: 9,
					lineHeight: 1.4
				},
				// 行動目標
				{
					name: 'behaviorGoalLabel',
					type: 'text',
					position: { x: 10, y: 108 },
					width: 30,
					height: 6,
					fontSize: 10,
					fontWeight: 'bold'
				},
				{
					name: 'behaviorGoal',
					type: 'text',
					position: { x: 10, y: 115 },
					width: 190,
					height: 20,
					fontSize: 9,
					lineHeight: 1.4
				},
				// 区切り線
				{
					name: 'line3',
					type: 'line',
					position: { x: 10, y: 138 },
					width: 190,
					height: 0.5,
					color: '#000000'
				},
				// 署名セクション
				{
					name: 'signatureSectionLabel',
					type: 'text',
					position: { x: 10, y: 260 },
					width: 40,
					height: 6,
					fontSize: 9
				},
				{
					name: 'patientSignatureLabel',
					type: 'text',
					position: { x: 10, y: 268 },
					width: 25,
					height: 6,
					fontSize: 9
				},
				{
					name: 'patientSignature',
					type: 'text',
					position: { x: 35, y: 268 },
					width: 50,
					height: 6,
					fontSize: 10
				},
				{
					name: 'doctorLabel',
					type: 'text',
					position: { x: 100, y: 268 },
					width: 20,
					height: 6,
					fontSize: 9
				},
				{
					name: 'primaryDoctorName',
					type: 'text',
					position: { x: 120, y: 268 },
					width: 40,
					height: 6,
					fontSize: 10
				},
				// 病院名
				{
					name: 'hospitalName',
					type: 'text',
					position: { x: 10, y: 280 },
					width: 100,
					height: 6,
					fontSize: 9
				},
				// 記入日
				{
					name: 'recordDateLabel',
					type: 'text',
					position: { x: 150, y: 280 },
					width: 20,
					height: 6,
					fontSize: 9
				},
				{
					name: 'recordDate',
					type: 'text',
					position: { x: 170, y: 280 },
					width: 30,
					height: 6,
					fontSize: 9
				}
			]
		]
	};
}

// 継続用テンプレート（様式9の2）のスキーマ定義
function createContinuousTemplate(): Template {
	const baseTemplate = createInitialTemplate();

	// 継続用の追加フィールド（目標達成状況、次の目標）を追加
	if (baseTemplate.schemas[0]) {
		baseTemplate.schemas[0].push(
			{
				name: 'goalAchievementLabel',
				type: 'text',
				position: { x: 10, y: 140 },
				width: 40,
				height: 6,
				fontSize: 10,
				fontWeight: 'bold'
			},
			{
				name: 'goalAchievementStatus',
				type: 'text',
				position: { x: 10, y: 147 },
				width: 190,
				height: 20,
				fontSize: 9,
				lineHeight: 1.4
			},
			{
				name: 'nextGoalLabel',
				type: 'text',
				position: { x: 10, y: 170 },
				width: 30,
				height: 6,
				fontSize: 10,
				fontWeight: 'bold'
			},
			{
				name: 'nextGoal',
				type: 'text',
				position: { x: 10, y: 177 },
				width: 190,
				height: 20,
				fontSize: 9,
				lineHeight: 1.4
			},
			{
				name: 'sequenceLabel',
				type: 'text',
				position: { x: 170, y: 10 },
				width: 30,
				height: 8,
				fontSize: 10
			}
		);
	}

	return baseTemplate;
}

// 日付フォーマット
function formatDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

// 疾患リストを文字列に変換
function formatDiseases(data: CarePlanPdfData): string {
	const diseases: string[] = [];
	if (data.hasDiabetes) diseases.push('糖尿病');
	if (data.hasHypertension) diseases.push('高血圧症');
	if (data.hasHyperlipidemia) diseases.push('高脂血症');
	return diseases.join('、');
}

// PDFデータからテンプレート入力データを生成
function createInputData(data: CarePlanPdfData): Record<string, string>[] {
	const title =
		data.planType === 'initial'
			? '生活習慣病療養計画書（初回用）'
			: '生活習慣病療養計画書（継続用）';

	const baseData: Record<string, string> = {
		title,
		patientInfoLabel: '患者氏名:',
		patientName: data.patientName,
		patientNumberLabel: '患者番号:',
		patientNumber: data.patientNumber,
		birthDateLabel: '生年月日:',
		birthDateAge: `${formatDate(data.birthDate)} (${data.age}歳)`,
		consultationDateLabel: '診療日:',
		consultationDate: formatDate(data.consultationDate),
		mainDiseaseLabel: '主病:',
		diseases: formatDiseases(data),
		line1: '',
		examSectionLabel: '【検査項目】',
		heightLabel: '身長:',
		height: data.height ? `${data.height} cm` : '',
		weightLabel: '体重:',
		weightCurrent: data.weightCurrent ? `${data.weightCurrent} kg` : '',
		weightTargetLabel: '目標体重:',
		weightTarget: data.weightTarget ? `${data.weightTarget} kg` : '',
		bmiLabel: 'BMI:',
		bmi: data.bmi || '',
		bpLabel: '血圧:',
		bloodPressure:
			data.bloodPressureSystolic && data.bloodPressureDiastolic
				? `${data.bloodPressureSystolic}/${data.bloodPressureDiastolic} mmHg`
				: '',
		bloodTestLabel: '採血日:',
		bloodTestDate: formatDate(data.bloodTestDate),
		hba1cLabel: 'HbA1c:',
		hba1cCurrent: data.hba1cCurrent ? `${data.hba1cCurrent}%` : '',
		hba1cTargetLabel: '目標:',
		hba1cTarget: data.hba1cTarget ? `${data.hba1cTarget}%` : '',
		cholesterolLabel: '総コレステロール:',
		totalCholesterol: data.totalCholesterol ? `${data.totalCholesterol} mg/dl` : '',
		triglyceridesLabel: '中性脂肪:',
		triglycerides: data.triglycerides ? `${data.triglycerides} mg/dl` : '',
		line2: '',
		achievementGoalLabel: '①達成目標',
		achievementGoal: data.achievementGoal || '',
		behaviorGoalLabel: '②行動目標',
		behaviorGoal: data.behaviorGoal || '',
		line3: '',
		signatureSectionLabel: '【署名】',
		patientSignatureLabel: '患者署名:',
		patientSignature: data.patientSignature || '',
		doctorLabel: '医師:',
		primaryDoctorName: data.primaryDoctorName || '',
		hospitalName: data.hospitalName,
		recordDateLabel: '記入日:',
		recordDate: formatDate(data.recordDate)
	};

	// 継続用の追加データ
	if (data.planType === 'continuous') {
		baseData['goalAchievementLabel'] = '③目標の達成状況';
		baseData['goalAchievementStatus'] = data.goalAchievementStatus || '';
		baseData['nextGoalLabel'] = '④次の目標';
		baseData['nextGoal'] = data.nextGoal || '';
		baseData['sequenceLabel'] = `第${data.sequenceNumber}回`;
	}

	return [baseData];
}

/**
 * 療養計画書PDFを生成
 */
export async function generateCarePlanPdf(data: CarePlanPdfData): Promise<Uint8Array> {
	const template =
		data.planType === 'initial' ? createInitialTemplate() : createContinuousTemplate();

	const inputs = createInputData(data);

	const font = getJapaneseFont();

	const pdf = await generate({
		template,
		inputs,
		plugins,
		options: { font }
	});

	return pdf;
}

/**
 * 複数の療養計画書PDFを一括生成
 */
export async function generateMultipleCarePlanPdfs(
	dataList: CarePlanPdfData[]
): Promise<Uint8Array[]> {
	const results: Uint8Array[] = [];

	for (const data of dataList) {
		const pdf = await generateCarePlanPdf(data);
		results.push(pdf);
	}

	return results;
}
