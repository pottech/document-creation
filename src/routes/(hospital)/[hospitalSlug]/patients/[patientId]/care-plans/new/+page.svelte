<script lang="ts">
	import { enhance } from "$app/forms";

	let { data } = $props();

	let activeTab = $state(0);
	let formError = $state("");
	let isSubmitting = $state(false);

	// フォーム状態
	let planType = $state<"initial" | "continuous">("initial");
	let sequenceNumber = $state(1);

	$effect(() => {
		planType = data.isInitial ? "initial" : "continuous";
		sequenceNumber = data.carePlanCount + 1;
	});

	// 前回データからの初期値
	const prevPlan = $derived(data.latestCarePlan);

	// タブ構成を簡素化: 必須項目 → 検査・問診 → 指導項目 → 確認
	const tabs = [
		{ id: "basic", label: "基本情報", icon: "person" },
		{ id: "exam", label: "検査・問診", icon: "medical" },
		{ id: "guidance", label: "指導項目", icon: "guidance" },
		{ id: "confirm", label: "確認・保存", icon: "check" },
	];

	function nextTab() {
		if (activeTab < tabs.length - 1) {
			activeTab++;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevTab() {
		if (activeTab > 0) {
			activeTab--;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function calculateAge(birthDate: string): number {
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	}

	const genderLabels: Record<string, string> = {
		male: "男性",
		female: "女性",
	};

	// 折りたたみ状態
	let expandedSections = $state<Record<string, boolean>>({
		bloodTest: true,
		interview: false,
		goals: true,
		diet: true,
		exercise: false,
		smoking: false,
		other: false,
		medication: false,
	});

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}
</script>

<div class="care-plan-page">
	<header class="page-header">
		<div class="header-left">
			<nav class="breadcrumb">
				<a href="/{data.hospital?.slug}/patients">患者管理</a>
				<span class="separator">/</span>
				<a href="/{data.hospital?.slug}/patients/{data.patient.id}">{data.patient.name}</a>
				<span class="separator">/</span>
				<span>療養計画書作成</span>
			</nav>
			<h1>療養計画書作成</h1>
		</div>
		<div class="patient-badge">
			<div class="patient-avatar">
				{data.patient.name.charAt(0)}
			</div>
			<div class="patient-info">
				<span class="patient-name">{data.patient.name}</span>
				<span class="patient-detail">
					{data.patient.patientNumber} / {genderLabels[data.patient.gender]} / {calculateAge(data.patient.birthDate)}歳
				</span>
			</div>
		</div>
	</header>

	<!-- ステップインジケーター -->
	<div class="step-indicator">
		{#each tabs as tab, i (tab.id)}
			<button
				class="step"
				class:active={activeTab === i}
				class:completed={activeTab > i}
				onclick={() => (activeTab = i)}
			>
				<span class="step-number">{i + 1}</span>
				<span class="step-label">{tab.label}</span>
			</button>
			{#if i < tabs.length - 1}
				<div class="step-line" class:completed={activeTab > i}></div>
			{/if}
		{/each}
	</div>

	{#if formError}
		<div class="error-banner">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			{formError}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === "failure") {
					formError = (result.data?.error as string) || "保存に失敗しました";
				} else {
					await update();
				}
			};
		}}
	>
		<!-- タブ1: 基本情報（必須項目） -->
		<div class="tab-panel" class:active={activeTab === 0}>
			<div class="content-card">
				<div class="card-header">
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						基本情報
					</h2>
					<span class="required-badge">必須項目</span>
				</div>
				<div class="card-body">
					<!-- 計画書種別 -->
					<div class="form-section">
						<span class="section-label">計画書種別</span>
						<div class="radio-group">
							<label class="radio-option" class:selected={planType === 'initial'}>
								<input
									type="radio"
									name="planType"
									value="initial"
									bind:group={planType}
									disabled={!data.isInitial}
								/>
								<div class="radio-content">
									<span class="radio-title">初回用（様式9）</span>
									<span class="radio-desc">初めての療養計画書</span>
								</div>
							</label>
							<label class="radio-option" class:selected={planType === 'continuous'}>
								<input
									type="radio"
									name="planType"
									value="continuous"
									bind:group={planType}
									disabled={data.isInitial}
								/>
								<div class="radio-content">
									<span class="radio-title">継続用（様式9の2）</span>
									<span class="radio-desc">2回目以降の計画書</span>
								</div>
							</label>
						</div>
						{#if planType === "continuous"}
							<div class="inline-field">
								<label for="sequenceNumber">回数</label>
								<input
									type="number"
									id="sequenceNumber"
									name="sequenceNumber"
									value={sequenceNumber}
									min="2"
									class="small-input"
								/>
								<span>回目</span>
							</div>
						{:else}
							<input type="hidden" name="sequenceNumber" value="1" />
						{/if}
					</div>

					<!-- 日付 -->
					<div class="form-section">
						<span class="section-label">日付</span>
						<div class="form-row">
							<div class="form-group">
								<label for="recordDate">記入日 <span class="required">必須</span></label>
								<input
									type="date"
									id="recordDate"
									name="recordDate"
									value={data.today}
									required
								/>
							</div>
							<div class="form-group">
								<label for="consultationDate">診療日 <span class="required">必須</span></label>
								<input
									type="date"
									id="consultationDate"
									name="consultationDate"
									value={data.today}
									required
								/>
							</div>
						</div>
					</div>

					<!-- 主病 -->
					<div class="form-section">
						<span class="section-label">主病 <span class="required">必須</span></span>
						<p class="hint">1つ以上選択してください</p>
						<div class="checkbox-group">
							<label class="checkbox-option">
								<input type="checkbox" name="hasDiabetes" checked={prevPlan?.hasDiabetes} />
								<span class="checkbox-label">糖尿病</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="hasHypertension" checked={prevPlan?.hasHypertension} />
								<span class="checkbox-label">高血圧症</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="hasHyperlipidemia" checked={prevPlan?.hasHyperlipidemia} />
								<span class="checkbox-label">高脂血症</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- タブ2: 検査・問診 -->
		<div class="tab-panel" class:active={activeTab === 1}>
			<!-- 身体計測（主要項目） -->
			<div class="content-card">
				<div class="card-header">
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
							<polyline points="22,6 12,13 2,6" />
						</svg>
						身体計測
					</h2>
				</div>
				<div class="card-body">
					<div class="form-row three-col">
						<div class="form-group">
							<label for="height">身長 (cm)</label>
							<input type="number" id="height" name="height" step="0.1" value={prevPlan?.height || ""} />
						</div>
						<div class="form-group">
							<label for="weightCurrent">体重・現在 (kg)</label>
							<input type="number" id="weightCurrent" name="weightCurrent" step="0.1" />
						</div>
						<div class="form-group">
							<label for="weightTarget">体重・目標 (kg)</label>
							<input type="number" id="weightTarget" name="weightTarget" step="0.1" value={prevPlan?.weightTarget || ""} />
						</div>
					</div>
					<div class="form-row three-col">
						<div class="form-group">
							<label for="waistCurrent">腹囲・現在 (cm)</label>
							<input type="number" id="waistCurrent" name="waistCurrent" step="0.1" />
						</div>
						<div class="form-group">
							<label for="waistTarget">腹囲・目標 (cm)</label>
							<input type="number" id="waistTarget" name="waistTarget" step="0.1" value={prevPlan?.waistTarget || ""} />
						</div>
						<div class="form-group">
							<label for="nutritionStatus">栄養状態</label>
							<select id="nutritionStatus" name="nutritionStatus">
								<option value="">選択してください</option>
								<option value="malnourished">低栄養状態の恐れ</option>
								<option value="good">良好</option>
								<option value="obese">肥満</option>
							</select>
						</div>
					</div>
					<div class="form-row three-col">
						<div class="form-group">
							<label for="bloodPressureSystolic">収縮期血圧 (mmHg)</label>
							<input type="number" id="bloodPressureSystolic" name="bloodPressureSystolic" />
						</div>
						<div class="form-group">
							<label for="bloodPressureDiastolic">拡張期血圧 (mmHg)</label>
							<input type="number" id="bloodPressureDiastolic" name="bloodPressureDiastolic" />
						</div>
						<div class="form-group checkbox-inline">
							<label class="checkbox-option">
								<input type="checkbox" name="hasExerciseEcg" />
								<span class="checkbox-label">運動負荷心電図</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- 血液検査（折りたたみ） -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('bloodTest')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
						</svg>
						血液検査
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.bloodTest}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.bloodTest}
					<div class="card-body">
						<div class="form-row three-col">
							<div class="form-group">
								<label for="bloodTestDate">採血日</label>
								<input type="date" id="bloodTestDate" name="bloodTestDate" />
							</div>
							<div class="form-group">
								<label for="bloodGlucoseCondition">血糖測定条件</label>
								<select id="bloodGlucoseCondition" name="bloodGlucoseCondition">
									<option value="">選択してください</option>
									<option value="fasting">空腹時</option>
									<option value="random">随時</option>
									<option value="postprandial">食後</option>
								</select>
							</div>
							<div class="form-group">
								<label for="bloodGlucosePostMealHours">食後時間</label>
								<input type="number" id="bloodGlucosePostMealHours" name="bloodGlucosePostMealHours" placeholder="時間" />
							</div>
						</div>
						<div class="form-row three-col">
							<div class="form-group">
								<label for="bloodGlucose">血糖値 (mg/dl)</label>
								<input type="number" id="bloodGlucose" name="bloodGlucose" />
							</div>
							<div class="form-group">
								<label for="hba1cCurrent">HbA1c・現在 (%)</label>
								<input type="number" id="hba1cCurrent" name="hba1cCurrent" step="0.1" />
							</div>
							<div class="form-group">
								<label for="hba1cTarget">HbA1c・目標 (%)</label>
								<input type="number" id="hba1cTarget" name="hba1cTarget" step="0.1" value={prevPlan?.hba1cTarget || ""} />
							</div>
						</div>
						<div class="form-row four-col">
							<div class="form-group">
								<label for="totalCholesterol">総コレステロール</label>
								<input type="number" id="totalCholesterol" name="totalCholesterol" />
							</div>
							<div class="form-group">
								<label for="triglycerides">中性脂肪</label>
								<input type="number" id="triglycerides" name="triglycerides" />
							</div>
							<div class="form-group">
								<label for="hdlCholesterol">HDL</label>
								<input type="number" id="hdlCholesterol" name="hdlCholesterol" />
							</div>
							<div class="form-group">
								<label for="ldlCholesterol">LDL</label>
								<input type="number" id="ldlCholesterol" name="ldlCholesterol" />
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- 問診（折りたたみ） -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('interview')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
						</svg>
						問診
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.interview}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.interview}
					<div class="card-body">
						<div class="form-group">
							<label for="dietarySituation">食事の状況</label>
							<textarea id="dietarySituation" name="dietarySituation" rows="2" placeholder="食事に関する状況を記入"></textarea>
						</div>
						<div class="form-group">
							<label for="exerciseSituation">運動の状況</label>
							<textarea id="exerciseSituation" name="exerciseSituation" rows="2" placeholder="運動に関する状況を記入"></textarea>
						</div>
						<div class="form-group">
							<label for="smokingSituation">たばこ</label>
							<textarea id="smokingSituation" name="smokingSituation" rows="2" placeholder="喫煙に関する状況を記入"></textarea>
						</div>
						<div class="form-group">
							<label for="otherLifestyle">その他の生活</label>
							<textarea id="otherLifestyle" name="otherLifestyle" rows="2" placeholder="その他の生活習慣を記入"></textarea>
						</div>
					</div>
				{/if}
			</div>

			<!-- 目標設定 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('goals')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<circle cx="12" cy="12" r="6" />
							<circle cx="12" cy="12" r="2" />
						</svg>
						目標設定
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.goals}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.goals}
					<div class="card-body">
						{#if planType === "continuous"}
							<div class="form-group">
								<label for="goalAchievementStatus">前回目標の達成状況 <span class="required">必須</span></label>
								<textarea id="goalAchievementStatus" name="goalAchievementStatus" rows="3" required></textarea>
							</div>
						{/if}
						<div class="form-group">
							<label for="achievementGoal">①達成目標（患者と相談した目標）</label>
							<textarea id="achievementGoal" name="achievementGoal" rows="3" placeholder="検査結果を理解できること・自分の生活上の問題点を抽出し、目標を設定できること"></textarea>
						</div>
						<div class="form-group">
							<label for="behaviorGoal">②行動目標（患者と相談した目標）</label>
							<textarea id="behaviorGoal" name="behaviorGoal" rows="3"></textarea>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- タブ3: 指導項目 -->
		<div class="tab-panel" class:active={activeTab === 2}>
			<!-- 食事指導 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('diet')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 8h1a4 4 0 0 1 0 8h-1" />
							<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
							<line x1="6" y1="1" x2="6" y2="4" />
							<line x1="10" y1="1" x2="10" y2="4" />
							<line x1="14" y1="1" x2="14" y2="4" />
						</svg>
						食事指導
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.diet}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.diet}
					<div class="card-body">
						{#if planType === "continuous"}
							<label class="checkbox-option highlight">
								<input type="checkbox" name="diet_noGuidanceNeeded" />
								<span class="checkbox-label">今回は、指導の必要なし</span>
							</label>
						{/if}

						<div class="checkbox-grid">
							<label class="checkbox-option">
								<input type="checkbox" name="diet_properIntake" />
								<span class="checkbox-label">食事摂取量を適正にする</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="diet_reduceSalt" />
								<span class="checkbox-label">食塩・調味料を控える</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="diet_increaseFiber" />
								<span class="checkbox-label">野菜・きのこ・海藻など食物繊維を増やす</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="diet_reduceOil" />
								<span class="checkbox-label">油を使った料理を減らす</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="diet_regularMeals" />
								<span class="checkbox-label">朝食・昼食・夕食を規則正しくとる</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="diet_slowEating" />
								<span class="checkbox-label">ゆっくり食べる</span>
							</label>
						</div>

						<div class="form-group">
							<label for="diet_eatingOutNotes">外食の際の注意事項</label>
							<input type="text" id="diet_eatingOutNotes" name="diet_eatingOutNotes" />
						</div>

						<div class="inline-group">
							<label class="checkbox-option">
								<input type="checkbox" name="diet_reduceAlcohol" />
								<span class="checkbox-label">節酒：減らす</span>
							</label>
							<input type="text" name="diet_reduceAlcohol_type" placeholder="種類・量" class="flex-input" />
							<span>を週</span>
							<input type="number" name="diet_reduceAlcohol_freq" class="small-input" min="0" max="7" />
							<span>回</span>
						</div>

						<div class="inline-group">
							<label class="checkbox-option">
								<input type="checkbox" name="diet_reduceSnacks" />
								<span class="checkbox-label">間食：減らす</span>
							</label>
							<input type="text" name="diet_reduceSnacks_type" placeholder="種類・量" class="flex-input" />
							<span>を週</span>
							<input type="number" name="diet_reduceSnacks_freq" class="small-input" min="0" max="7" />
							<span>回</span>
						</div>

						<div class="form-group">
							<label for="diet_other">その他</label>
							<input type="text" id="diet_other" name="diet_other" />
						</div>

						<div class="form-group">
							<label for="staff_diet">担当者</label>
							<select id="staff_diet" name="staff_diet">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- 運動指導 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('exercise')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="5" r="3" />
							<line x1="12" y1="22" x2="12" y2="8" />
							<path d="M5 12H2a10 10 0 0 0 20 0h-3" />
						</svg>
						運動指導
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.exercise}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.exercise}
					<div class="card-body">
						{#if planType === "continuous"}
							<label class="checkbox-option highlight">
								<input type="checkbox" name="exercise_noGuidanceNeeded" />
								<span class="checkbox-label">今回は、指導の必要なし</span>
							</label>
						{/if}

						<div class="form-row">
							<div class="form-group">
								<label for="exercise_type">種類</label>
								<input type="text" id="exercise_type" name="exercise_type" placeholder="ウォーキング" />
							</div>
							<div class="form-group">
								<label for="exercise_duration">時間</label>
								<input type="text" id="exercise_duration" name="exercise_duration" placeholder="30分以上" />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="exercise_frequency">頻度</label>
								<select id="exercise_frequency" name="exercise_frequency">
									<option value="">選択してください</option>
									<option value="daily">ほぼ毎日</option>
									<option value="weekly">週指定</option>
								</select>
							</div>
							<div class="form-group">
								<label for="exercise_weeklyDays">週日数</label>
								<input type="number" id="exercise_weeklyDays" name="exercise_weeklyDays" min="1" max="7" />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="exercise_intensity">強度</label>
								<input type="text" id="exercise_intensity" name="exercise_intensity" placeholder="息がはずむが会話が可能な強さ" />
							</div>
							<div class="form-group">
								<label for="exercise_heartRate">脈拍 (拍/分)</label>
								<input type="number" id="exercise_heartRate" name="exercise_heartRate" />
							</div>
						</div>

						<div class="form-group">
							<label for="exercise_dailyActivity">日常生活の活動量増加</label>
							<input type="text" id="exercise_dailyActivity" name="exercise_dailyActivity" placeholder="例：1日1万歩" />
						</div>

						<div class="form-group">
							<label for="exercise_notes">運動時の注意事項</label>
							<textarea id="exercise_notes" name="exercise_notes" rows="2"></textarea>
						</div>

						<div class="form-group">
							<label for="staff_exercise">担当者</label>
							<select id="staff_exercise" name="staff_exercise">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- たばこ指導 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('smoking')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="12" x2="22" y2="12" />
							<line x1="2" y1="12" x2="9" y2="12" />
							<line x1="9" y1="9" x2="9" y2="15" />
							<line x1="12" y1="8" x2="12" y2="16" />
						</svg>
						たばこ指導
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.smoking}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.smoking}
					<div class="card-body">
						<div class="checkbox-grid">
							<label class="checkbox-option">
								<input type="checkbox" name="smoking_isNonSmoker" />
								<span class="checkbox-label">非喫煙者である</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="smoking_effectiveness" />
								<span class="checkbox-label">禁煙・節煙の有効性</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="smoking_method" />
								<span class="checkbox-label">禁煙の実施方法等</span>
							</label>
						</div>
						<div class="form-group">
							<label for="staff_smoking">担当者</label>
							<select id="staff_smoking" name="staff_smoking">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- その他指導 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('other')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
						その他指導
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.other}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.other}
					<div class="card-body">
						<div class="checkbox-grid">
							<label class="checkbox-option">
								<input type="checkbox" name="other_work" />
								<span class="checkbox-label">仕事</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="other_leisure" />
								<span class="checkbox-label">余暇</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="other_sleep" />
								<span class="checkbox-label">睡眠の確保（質・量）</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="other_weightLoss" />
								<span class="checkbox-label">減量</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="other_homeMeasurement" />
								<span class="checkbox-label">家庭での計測（歩数、体重、血圧、腹囲等）</span>
							</label>
						</div>
						<div class="form-group">
							<label for="other_other">その他</label>
							<input type="text" id="other_other" name="other_other" />
						</div>
						<div class="form-group">
							<label for="staff_other">担当者</label>
							<select id="staff_other" name="staff_other">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- 服薬指導 -->
			<div class="content-card collapsible">
				<button type="button" class="card-header clickable" onclick={() => toggleSection('medication')}>
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M10.5 20.5 L17.5 13.5 Q21 10 17.5 6.5 Q14 3 10.5 6.5 L3.5 13.5 Q0 17 3.5 20.5 Q7 24 10.5 20.5" />
							<line x1="7" y1="10" x2="14" y2="17" />
						</svg>
						服薬指導
					</h2>
					<span class="collapse-icon" class:expanded={expandedSections.medication}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</span>
				</button>
				{#if expandedSections.medication}
					<div class="card-body">
						<div class="checkbox-grid">
							<label class="checkbox-option">
								<input type="checkbox" name="hasNoPrescription" />
								<span class="checkbox-label">処方なし</span>
							</label>
							<label class="checkbox-option">
								<input type="checkbox" name="hasMedicationExplanation" />
								<span class="checkbox-label">薬の説明</span>
							</label>
						</div>
						<div class="form-group">
							<label for="staff_medication">担当者</label>
							<select id="staff_medication" name="staff_medication">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			<!-- 療養上の問題点 -->
			<div class="content-card">
				<div class="card-header">
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						療養上の問題点
					</h2>
				</div>
				<div class="card-body">
					<div class="form-group">
						<label for="treatmentIssues">療養を行うにあたっての問題点</label>
						<textarea id="treatmentIssues" name="treatmentIssues" rows="3"></textarea>
					</div>
					<div class="form-group">
						<label for="otherFacilityUsage">他の施設の利用状況について</label>
						<textarea id="otherFacilityUsage" name="otherFacilityUsage" rows="2"></textarea>
					</div>
				</div>
			</div>
		</div>

		<!-- タブ4: 確認・保存 -->
		<div class="tab-panel" class:active={activeTab === 3}>
			<div class="content-card">
				<div class="card-header">
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22 4 12 14.01 9 11.01" />
						</svg>
						署名・確認
					</h2>
				</div>
				<div class="card-body">
					<div class="form-group">
						<label for="patientSignature">患者署名</label>
						<input type="text" id="patientSignature" name="patientSignature" />
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="primaryDoctorId">医師（上段）</label>
							<select id="primaryDoctorId" name="primaryDoctorId">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label for="secondaryDoctorId">医師（下段）</label>
							<select id="secondaryDoctorId" name="secondaryDoctorId">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff (staff.id)}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<div class="content-card">
				<div class="card-header">
					<h2>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
							<polyline points="17 21 17 13 7 13 7 21" />
							<polyline points="7 3 7 8 15 8" />
						</svg>
						保存オプション
					</h2>
				</div>
				<div class="card-body">
					<div class="radio-group vertical">
						<label class="radio-option" class:selected={true}>
							<input type="radio" name="status" value="draft" checked />
							<div class="radio-content">
								<span class="radio-title">下書きとして保存</span>
								<span class="radio-desc">後で編集を続けることができます</span>
							</div>
						</label>
						<label class="radio-option">
							<input type="radio" name="status" value="completed" />
							<div class="radio-content">
								<span class="radio-title">作成完了として保存</span>
								<span class="radio-desc">療養計画書の作成を完了します</span>
							</div>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- フッターナビゲーション -->
		<div class="form-footer">
			<div class="footer-left">
				{#if activeTab > 0}
					<button type="button" class="btn-secondary" onclick={prevTab}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15 18 9 12 15 6" />
						</svg>
						前へ
					</button>
				{/if}
			</div>
			<div class="footer-right">
				{#if activeTab < tabs.length - 1}
					<button type="button" class="btn-primary" onclick={nextTab}>
						次へ
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</button>
				{:else}
					<button type="submit" class="btn-submit" disabled={isSubmitting}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							{#if isSubmitting}
								<circle cx="12" cy="12" r="10" />
							{:else}
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
								<polyline points="17 21 17 13 7 13 7 21" />
								<polyline points="7 3 7 8 15 8" />
							{/if}
						</svg>
						{isSubmitting ? "保存中..." : "保存する"}
					</button>
				{/if}
			</div>
		</div>
	</form>
</div>

<style>
	/* Base Reset */
	.care-plan-page *,
	.care-plan-page *::before,
	.care-plan-page *::after {
		box-sizing: border-box;
	}

	.care-plan-page {
		max-width: 900px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		flex: 1;
		min-width: 0;
	}

	.header-left h1 {
		margin: 0.5rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a2b3c;
		letter-spacing: -0.02em;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #6b7c8c;
	}

	.breadcrumb a {
		color: #0f4c5c;
		text-decoration: none;
		white-space: nowrap;
	}

	.breadcrumb a:hover {
		color: #5dd9c1;
	}

	.breadcrumb .separator {
		color: #c0c8d0;
	}

	.patient-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		border-radius: 12px;
		flex-shrink: 0;
	}

	.patient-avatar {
		width: 40px;
		height: 40px;
		min-width: 40px;
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		color: #0a3642;
	}

	.patient-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.patient-name {
		font-weight: 600;
		color: #1a2b3c;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.patient-detail {
		font-size: 0.75rem;
		color: #6b7c8c;
		white-space: nowrap;
	}

	/* Step Indicator */
	.step-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
		padding: 0.75rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.step:hover {
		background: #f0f4f8;
	}

	.step-number {
		width: 26px;
		height: 26px;
		min-width: 26px;
		background: #e8eef3;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.75rem;
		color: #6b7c8c;
		transition: all 0.2s ease;
	}

	.step.active .step-number {
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		color: white;
	}

	.step.completed .step-number {
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		color: #0a3642;
	}

	.step-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b7c8c;
	}

	.step.active .step-label {
		color: #0f4c5c;
		font-weight: 600;
	}

	.step-line {
		width: 24px;
		height: 2px;
		background: #e8eef3;
		flex-shrink: 0;
	}

	.step-line.completed {
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		background: #fef2f2;
		color: #dc2626;
		padding: 0.875rem 1rem;
		border-radius: 10px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.error-banner svg {
		flex-shrink: 0;
	}

	/* Tab Panels */
	.tab-panel {
		display: none;
	}

	.tab-panel.active {
		display: block;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Content Card */
	.content-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.content-card.collapsible .card-header {
		cursor: pointer;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid #f0f4f8;
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
		width: 100%;
		text-align: left;
	}

	.card-header.clickable {
		transition: background 0.2s ease;
	}

	.card-header.clickable:hover {
		background: #fafbfc;
	}

	.card-header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a2b3c;
		min-width: 0;
	}

	.card-header h2 svg {
		color: #5dd9c1;
		flex-shrink: 0;
		width: 18px;
		height: 18px;
	}

	.required-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.625rem;
		font-weight: 600;
		color: white;
		background: #e74c3c;
		padding: 0.1875rem 0.5rem;
		border-radius: 4px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.collapse-icon {
		color: #9ba8b5;
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.collapse-icon.expanded {
		transform: rotate(180deg);
	}

	.collapse-icon svg {
		width: 18px;
		height: 18px;
	}

	.card-body {
		padding: 1rem;
	}

	/* Form Elements */
	.form-section {
		margin-bottom: 1.25rem;
	}

	.form-section:last-child {
		margin-bottom: 0;
	}

	.section-label {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #4a5b6c;
		margin-bottom: 0.75rem;
	}

	.hint {
		font-size: 0.8125rem;
		color: #9ba8b5;
		margin: -0.25rem 0 0.75rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #4a5b6c;
		margin-bottom: 0.375rem;
	}

	.required {
		display: inline-flex;
		align-items: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: white;
		background: #e74c3c;
		padding: 0.125rem 0.3125rem;
		border-radius: 3px;
		white-space: nowrap;
		line-height: 1.2;
		vertical-align: middle;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		display: block;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 2px solid #e8eef3;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #1a2b3c;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		font-family: inherit;
		background: white;
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: #9ba8b5;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #5dd9c1;
		box-shadow: 0 0 0 3px rgba(93, 217, 193, 0.15);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 60px;
	}

	/* Form Row - Grid Layout */
	.form-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.form-row.three-col {
		grid-template-columns: repeat(3, 1fr);
	}

	.form-row.four-col {
		grid-template-columns: repeat(4, 1fr);
	}

	.form-row .form-group {
		margin-bottom: 0;
		min-width: 0;
	}

	/* Radio & Checkbox */
	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.radio-group.vertical {
		flex-direction: column;
	}

	.radio-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 2px solid #e8eef3;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.radio-option:hover {
		border-color: #5dd9c1;
	}

	.radio-option.selected {
		border-color: #5dd9c1;
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
	}

	.radio-option input {
		width: 18px;
		height: 18px;
		min-width: 18px;
		accent-color: #0f4c5c;
		margin-top: 2px;
	}

	.radio-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.radio-title {
		font-weight: 600;
		font-size: 0.875rem;
		color: #1a2b3c;
	}

	.radio-desc {
		font-size: 0.75rem;
		color: #6b7c8c;
	}

	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: #fafbfc;
		border: 1px solid #e8eef3;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.checkbox-option:hover {
		background: #f0f4f8;
		border-color: #5dd9c1;
	}

	.checkbox-option.highlight {
		background: #fef3c7;
		border-color: #f59e0b;
		margin-bottom: 0.75rem;
	}

	.checkbox-option input {
		width: 16px;
		height: 16px;
		min-width: 16px;
		accent-color: #0f4c5c;
	}

	.checkbox-label {
		font-size: 0.8125rem;
		color: #4a5b6c;
		line-height: 1.3;
	}

	.checkbox-inline {
		display: flex;
		align-items: center;
	}

	/* Inline Fields */
	.inline-field {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.inline-field label {
		font-size: 0.8125rem;
		color: #4a5b6c;
		white-space: nowrap;
	}

	.inline-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
		padding: 0.625rem 0.75rem;
		background: #fafbfc;
		border-radius: 8px;
		font-size: 0.8125rem;
	}

	.inline-group .checkbox-option {
		background: white;
	}

	.inline-group span {
		white-space: nowrap;
		color: #4a5b6c;
	}

	.inline-group input[type="text"],
	.inline-group input[type="number"] {
		padding: 0.5rem 0.625rem;
		border: 1px solid #e8eef3;
		border-radius: 6px;
		font-size: 0.8125rem;
	}

	.small-input {
		width: 60px !important;
		min-width: 60px;
		text-align: center;
	}

	.flex-input {
		flex: 1;
		min-width: 100px;
		max-width: 200px;
	}

	/* Footer */
	.form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
	}

	.footer-left,
	.footer-right {
		display: flex;
		gap: 0.5rem;
	}

	.btn-primary,
	.btn-secondary,
	.btn-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-primary svg,
	.btn-secondary svg,
	.btn-submit svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.btn-primary {
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(15, 76, 92, 0.25);
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(15, 76, 92, 0.35);
	}

	.btn-secondary {
		background: #f0f4f8;
		color: #4a5b6c;
		border: 2px solid #e8eef3;
	}

	.btn-secondary:hover {
		background: #e8eef3;
	}

	.btn-submit {
		background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
		color: white;
		padding: 0.75rem 1.25rem;
		box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
	}

	.btn-submit:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* ============================================
	   RESPONSIVE DESIGN
	   ============================================ */

	/* Large Tablet (1024px and below) */
	@media (max-width: 1024px) {
		.form-row.four-col {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Tablet (768px and below) */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.patient-badge {
			width: 100%;
		}

		.header-left h1 {
			font-size: 1.25rem;
		}

		.step-label {
			display: none;
		}

		.step {
			padding: 0.5rem;
		}

		.step-line {
			width: 16px;
		}

		.form-row,
		.form-row.three-col,
		.form-row.four-col {
			grid-template-columns: 1fr;
		}

		.checkbox-grid {
			grid-template-columns: 1fr;
		}

		.radio-group {
			flex-direction: column;
		}

		.card-body {
			padding: 0.875rem;
		}

		.inline-group {
			flex-direction: column;
			align-items: stretch;
		}

		.inline-group .checkbox-option {
			width: 100%;
		}

		.inline-group input[type="text"],
		.inline-group input[type="number"] {
			width: 100%;
		}

		.flex-input {
			max-width: none;
		}

		.form-footer {
			flex-direction: column;
		}

		.footer-left,
		.footer-right {
			width: 100%;
		}

		.footer-left {
			order: 2;
		}

		.footer-right {
			order: 1;
		}

		.btn-primary,
		.btn-secondary,
		.btn-submit {
			flex: 1;
			justify-content: center;
		}
	}

	/* Mobile (480px and below) */
	@media (max-width: 480px) {
		.care-plan-page {
			margin: 0 -0.5rem;
		}

		.step-indicator {
			padding: 0.5rem;
			border-radius: 12px;
		}

		.step-number {
			width: 24px;
			height: 24px;
			min-width: 24px;
			font-size: 0.6875rem;
		}

		.step-line {
			width: 12px;
		}

		.content-card {
			border-radius: 12px;
		}

		.card-header {
			padding: 0.75rem;
		}

		.card-header h2 {
			font-size: 0.875rem;
		}

		.card-body {
			padding: 0.75rem;
		}

		.form-group input,
		.form-group select,
		.form-group textarea {
			padding: 0.5rem 0.625rem;
			font-size: 0.8125rem;
		}

		.radio-option {
			padding: 0.75rem;
		}

		.form-footer {
			padding: 0.75rem;
			border-radius: 12px;
		}

		.breadcrumb {
			font-size: 0.75rem;
		}

		.header-left h1 {
			font-size: 1.125rem;
		}
	}
</style>
