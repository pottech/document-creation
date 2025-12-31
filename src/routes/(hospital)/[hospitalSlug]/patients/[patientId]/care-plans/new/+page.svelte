<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let activeTab = $state(0);
	let formError = $state('');
	let isSubmitting = $state(false);

	// フォーム状態
	let planType = $state<'initial' | 'continuous'>(data.isInitial ? 'initial' : 'continuous');
	let sequenceNumber = $state(data.carePlanCount + 1);

	// 前回データからの初期値
	const prevPlan = data.latestCarePlan;

	const tabs = [
		'基本情報',
		'検査項目',
		'問診・目標',
		'食事指導',
		'運動指導',
		'たばこ・その他',
		'署名・確認'
	];

	function nextTab() {
		if (activeTab < tabs.length - 1) {
			activeTab++;
		}
	}

	function prevTab() {
		if (activeTab > 0) {
			activeTab--;
		}
	}

	function calculateAge(birthDate: string): number {
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	const genderLabels: Record<string, string> = {
		male: '男',
		female: '女'
	};
</script>

<div class="care-plan-form">
	<div class="breadcrumb">
		<a href="/{data.hospital?.slug}/patients">患者管理</a>
		<span>/</span>
		<a href="/{data.hospital?.slug}/patients/{data.patient.id}">{data.patient.name}</a>
		<span>/</span>
		<span>療養計画書作成</span>
	</div>

	<div class="header">
		<h1>療養計画書作成</h1>
		<div class="patient-info-badge">
			<span class="patient-name">{data.patient.name}</span>
			<span class="patient-detail">
				{data.patient.patientNumber} / {genderLabels[data.patient.gender]} / {calculateAge(data.patient.birthDate)}歳
			</span>
		</div>
	</div>

	<!-- タブナビゲーション -->
	<div class="tabs">
		{#each tabs as tab, i}
			<button
				class="tab"
				class:active={activeTab === i}
				onclick={() => (activeTab = i)}
			>
				<span class="tab-number">{i + 1}</span>
				<span class="tab-label">{tab}</span>
			</button>
		{/each}
	</div>

	{#if formError}
		<div class="error-banner">{formError}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'failure') {
					formError = (result.data?.error as string) || '保存に失敗しました';
				} else {
					await update();
				}
			};
		}}
	>
		<div class="form-content">
			<!-- タブ1: 基本情報 -->
			<div class="tab-panel" class:active={activeTab === 0}>
				<h2>基本情報</h2>

				<div class="form-section">
					<h3>計画書種別</h3>
					<div class="radio-group">
						<label class="radio-label">
							<input
								type="radio"
								name="planType"
								value="initial"
								bind:group={planType}
								disabled={!data.isInitial}
							/>
							<span>初回用（様式9）</span>
						</label>
						<label class="radio-label">
							<input
								type="radio"
								name="planType"
								value="continuous"
								bind:group={planType}
								disabled={data.isInitial}
							/>
							<span>継続用（様式9の2）</span>
						</label>
					</div>
					{#if planType === 'continuous'}
						<div class="form-group inline">
							<label for="sequenceNumber">回数</label>
							<input
								type="number"
								id="sequenceNumber"
								name="sequenceNumber"
								value={sequenceNumber}
								min="2"
								class="small"
							/>
							<span>回目</span>
						</div>
					{:else}
						<input type="hidden" name="sequenceNumber" value="1" />
					{/if}
				</div>

				<div class="form-section">
					<h3>日付</h3>
					<div class="form-row">
						<div class="form-group">
							<label for="recordDate">記入日 *</label>
							<input type="date" id="recordDate" name="recordDate" value={data.today} required />
						</div>
						<div class="form-group">
							<label for="consultationDate">診療日 *</label>
							<input type="date" id="consultationDate" name="consultationDate" value={data.today} required />
						</div>
					</div>
				</div>

				<div class="form-section">
					<h3>主病 *</h3>
					<p class="hint">1つ以上選択してください</p>
					<div class="checkbox-group">
						<label class="checkbox-label">
							<input type="checkbox" name="hasDiabetes" checked={prevPlan?.hasDiabetes} />
							<span>糖尿病</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="hasHypertension" checked={prevPlan?.hasHypertension} />
							<span>高血圧症</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="hasHyperlipidemia" checked={prevPlan?.hasHyperlipidemia} />
							<span>高脂血症</span>
						</label>
					</div>
				</div>
			</div>

			<!-- タブ2: 検査項目 -->
			<div class="tab-panel" class:active={activeTab === 1}>
				<h2>検査項目</h2>

				<div class="form-section">
					<h3>身体計測</h3>
					<div class="form-row">
						<div class="form-group">
							<label for="height">身長 (cm)</label>
							<input type="number" id="height" name="height" step="0.1" value={prevPlan?.height || ''} />
						</div>
						<div class="form-group">
							<label for="weightCurrent">体重・現在 (kg)</label>
							<input type="number" id="weightCurrent" name="weightCurrent" step="0.1" />
						</div>
						<div class="form-group">
							<label for="weightTarget">体重・目標 (kg)</label>
							<input type="number" id="weightTarget" name="weightTarget" step="0.1" value={prevPlan?.weightTarget || ''} />
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="waistCurrent">腹囲・現在 (cm)</label>
							<input type="number" id="waistCurrent" name="waistCurrent" step="0.1" />
						</div>
						<div class="form-group">
							<label for="waistTarget">腹囲・目標 (cm)</label>
							<input type="number" id="waistTarget" name="waistTarget" step="0.1" value={prevPlan?.waistTarget || ''} />
						</div>
						<div class="form-group">
							<label for="nutritionStatus">栄養状態</label>
							<select id="nutritionStatus" name="nutritionStatus">
								<option value="">選択</option>
								<option value="malnourished">低栄養状態の恐れ</option>
								<option value="good">良好</option>
								<option value="obese">肥満</option>
							</select>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="bloodPressureSystolic">収縮期血圧 (mmHg)</label>
							<input type="number" id="bloodPressureSystolic" name="bloodPressureSystolic" />
						</div>
						<div class="form-group">
							<label for="bloodPressureDiastolic">拡張期血圧 (mmHg)</label>
							<input type="number" id="bloodPressureDiastolic" name="bloodPressureDiastolic" />
						</div>
						<div class="form-group">
							<label class="checkbox-label standalone">
								<input type="checkbox" name="hasExerciseEcg" />
								<span>運動負荷心電図</span>
							</label>
						</div>
					</div>
				</div>

				<div class="form-section">
					<h3>血液検査</h3>
					<div class="form-row">
						<div class="form-group">
							<label for="bloodTestDate">採血日</label>
							<input type="date" id="bloodTestDate" name="bloodTestDate" />
						</div>
						<div class="form-group">
							<label for="bloodGlucoseCondition">血糖測定条件</label>
							<select id="bloodGlucoseCondition" name="bloodGlucoseCondition">
								<option value="">選択</option>
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

					<div class="form-row">
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
							<input type="number" id="hba1cTarget" name="hba1cTarget" step="0.1" value={prevPlan?.hba1cTarget || ''} />
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="totalCholesterol">総コレステロール (mg/dl)</label>
							<input type="number" id="totalCholesterol" name="totalCholesterol" />
						</div>
						<div class="form-group">
							<label for="triglycerides">中性脂肪 (mg/dl)</label>
							<input type="number" id="triglycerides" name="triglycerides" />
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="hdlCholesterol">HDLコレステロール (mg/dl)</label>
							<input type="number" id="hdlCholesterol" name="hdlCholesterol" />
						</div>
						<div class="form-group">
							<label for="ldlCholesterol">LDLコレステロール (mg/dl)</label>
							<input type="number" id="ldlCholesterol" name="ldlCholesterol" />
						</div>
					</div>
				</div>
			</div>

			<!-- タブ3: 問診・目標 -->
			<div class="tab-panel" class:active={activeTab === 2}>
				<h2>問診・目標設定</h2>

				<div class="form-section">
					<h3>問診</h3>
					<div class="form-group">
						<label for="dietarySituation">食事の状況</label>
						<textarea id="dietarySituation" name="dietarySituation" rows="2"></textarea>
					</div>
					<div class="form-group">
						<label for="exerciseSituation">運動の状況</label>
						<textarea id="exerciseSituation" name="exerciseSituation" rows="2"></textarea>
					</div>
					<div class="form-group">
						<label for="smokingSituation">たばこ</label>
						<textarea id="smokingSituation" name="smokingSituation" rows="2"></textarea>
					</div>
					<div class="form-group">
						<label for="otherLifestyle">その他の生活</label>
						<textarea id="otherLifestyle" name="otherLifestyle" rows="2"></textarea>
					</div>
				</div>

				{#if planType === 'continuous'}
					<div class="form-section">
						<h3>目標の達成状況</h3>
						<div class="form-group">
							<label for="goalAchievementStatus">前回目標の達成状況 *</label>
							<textarea id="goalAchievementStatus" name="goalAchievementStatus" rows="3" required></textarea>
						</div>
					</div>
				{/if}

				<div class="form-section">
					<h3>目標設定</h3>
					<div class="form-group">
						<label for="achievementGoal">①達成目標（患者と相談した目標）</label>
						<textarea id="achievementGoal" name="achievementGoal" rows="3" placeholder="検査結果を理解できること・自分の生活上の問題点を抽出し、目標を設定できること"></textarea>
					</div>
					<div class="form-group">
						<label for="behaviorGoal">②行動目標（患者と相談した目標）</label>
						<textarea id="behaviorGoal" name="behaviorGoal" rows="3"></textarea>
					</div>
				</div>
			</div>

			<!-- タブ4: 食事指導 -->
			<div class="tab-panel" class:active={activeTab === 3}>
				<h2>重点指導項目（食事）</h2>

				{#if planType === 'continuous'}
					<label class="checkbox-label highlight">
						<input type="checkbox" name="diet_noGuidanceNeeded" />
						<span>今回は、指導の必要なし</span>
					</label>
				{/if}

				<div class="form-section">
					<div class="checkbox-grid">
						<label class="checkbox-label">
							<input type="checkbox" name="diet_properIntake" />
							<span>食事摂取量を適正にする</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="diet_reduceSalt" />
							<span>食塩・調味料を控える</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="diet_increaseFiber" />
							<span>野菜・きのこ・海藻など食物繊維の摂取を増やす</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="diet_reduceOil" />
							<span>油を使った料理の摂取を減らす</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="diet_regularMeals" />
							<span>朝食、昼食、夕食を規則正しくとる</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="diet_slowEating" />
							<span>ゆっくり食べる</span>
						</label>
					</div>

					<div class="form-group">
						<label for="diet_eatingOutNotes">外食の際の注意事項</label>
						<input type="text" id="diet_eatingOutNotes" name="diet_eatingOutNotes" />
					</div>

					<div class="inline-group">
						<label class="checkbox-label">
							<input type="checkbox" name="diet_reduceAlcohol" />
							<span>節酒：減らす</span>
						</label>
						<input type="text" name="diet_reduceAlcohol_type" placeholder="種類・量" class="flex-input" />
						<span>を週</span>
						<input type="number" name="diet_reduceAlcohol_freq" class="small" min="0" max="7" />
						<span>回</span>
					</div>

					<div class="inline-group">
						<label class="checkbox-label">
							<input type="checkbox" name="diet_reduceSnacks" />
							<span>間食：減らす</span>
						</label>
						<input type="text" name="diet_reduceSnacks_type" placeholder="種類・量" class="flex-input" />
						<span>を週</span>
						<input type="number" name="diet_reduceSnacks_freq" class="small" min="0" max="7" />
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
							{#each data.staffMembers as staff}
								<option value={staff.id}>{staff.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- タブ5: 運動指導 -->
			<div class="tab-panel" class:active={activeTab === 4}>
				<h2>重点指導項目（運動）</h2>

				{#if planType === 'continuous'}
					<label class="checkbox-label highlight">
						<input type="checkbox" name="exercise_noGuidanceNeeded" />
						<span>今回は、指導の必要なし</span>
					</label>
				{/if}

				<div class="form-section">
					<h3>運動処方</h3>
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
								<option value="">選択</option>
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
							{#each data.staffMembers as staff}
								<option value={staff.id}>{staff.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- タブ6: たばこ・その他 -->
			<div class="tab-panel" class:active={activeTab === 5}>
				<h2>重点指導項目（たばこ・その他）</h2>

				<div class="form-section">
					<h3>たばこ</h3>
					<div class="checkbox-grid">
						<label class="checkbox-label">
							<input type="checkbox" name="smoking_isNonSmoker" />
							<span>非喫煙者である</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="smoking_effectiveness" />
							<span>禁煙・節煙の有効性</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="smoking_method" />
							<span>禁煙の実施方法等</span>
						</label>
					</div>
					<div class="form-group">
						<label for="staff_smoking">担当者</label>
						<select id="staff_smoking" name="staff_smoking">
							<option value="">選択してください</option>
							{#each data.staffMembers as staff}
								<option value={staff.id}>{staff.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-section">
					<h3>その他</h3>
					<div class="checkbox-grid">
						<label class="checkbox-label">
							<input type="checkbox" name="other_work" />
							<span>仕事</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="other_leisure" />
							<span>余暇</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="other_sleep" />
							<span>睡眠の確保（質・量）</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="other_weightLoss" />
							<span>減量</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="other_homeMeasurement" />
							<span>家庭での計測（歩数、体重、血圧、腹囲等）</span>
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
							{#each data.staffMembers as staff}
								<option value={staff.id}>{staff.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-section">
					<h3>服薬指導</h3>
					<div class="checkbox-grid">
						<label class="checkbox-label">
							<input type="checkbox" name="hasNoPrescription" />
							<span>処方なし</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" name="hasMedicationExplanation" />
							<span>薬の説明</span>
						</label>
					</div>
					<div class="form-group">
						<label for="staff_medication">担当者</label>
						<select id="staff_medication" name="staff_medication">
							<option value="">選択してください</option>
							{#each data.staffMembers as staff}
								<option value={staff.id}>{staff.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-section">
					<h3>療養上の問題点</h3>
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

			<!-- タブ7: 署名・確認 -->
			<div class="tab-panel" class:active={activeTab === 6}>
				<h2>署名・確認</h2>

				<div class="form-section">
					<h3>署名</h3>
					<div class="form-group">
						<label for="patientSignature">患者署名</label>
						<input type="text" id="patientSignature" name="patientSignature" />
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="primaryDoctorId">医師（上段）</label>
							<select id="primaryDoctorId" name="primaryDoctorId">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label for="secondaryDoctorId">医師（下段）</label>
							<select id="secondaryDoctorId" name="secondaryDoctorId">
								<option value="">選択してください</option>
								{#each data.staffMembers as staff}
									<option value={staff.id}>{staff.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<div class="form-section">
					<h3>保存オプション</h3>
					<div class="radio-group">
						<label class="radio-label">
							<input type="radio" name="status" value="draft" checked />
							<span>下書きとして保存</span>
						</label>
						<label class="radio-label">
							<input type="radio" name="status" value="completed" />
							<span>作成完了として保存</span>
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
						← 前へ
					</button>
				{/if}
			</div>
			<div class="footer-right">
				{#if activeTab < tabs.length - 1}
					<button type="button" class="btn-primary" onclick={nextTab}>
						次へ →
					</button>
				{:else}
					<button type="submit" class="btn-submit" disabled={isSubmitting}>
						{isSubmitting ? '保存中...' : '保存する'}
					</button>
				{/if}
			</div>
		</div>
	</form>
</div>

<style>
	.care-plan-form {
		max-width: 900px;
		margin: 0 auto;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.breadcrumb a {
		color: #2563eb;
		text-decoration: none;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header h1 {
		margin: 0;
	}

	.patient-info-badge {
		background: #f1f5f9;
		padding: 0.5rem 1rem;
		border-radius: 4px;
	}

	.patient-name {
		font-weight: 600;
	}

	.patient-detail {
		margin-left: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		font-size: 0.875rem;
	}

	.tab:hover {
		background: #f8fafc;
	}

	.tab.active {
		background: #2563eb;
		color: white;
		border-color: #2563eb;
	}

	.tab-number {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #e2e8f0;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tab.active .tab-number {
		background: rgba(255, 255, 255, 0.2);
	}

	.error-banner {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.form-content {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-height: 400px;
	}

	.tab-panel {
		display: none;
	}

	.tab-panel.active {
		display: block;
	}

	.tab-panel h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #334155;
		margin-bottom: 1rem;
	}

	.hint {
		font-size: 0.75rem;
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.form-group input.small {
		width: 80px;
	}

	.form-group.inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.form-group.inline label {
		margin-bottom: 0;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.radio-group,
	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.radio-label,
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label.standalone {
		margin-top: 1.5rem;
	}

	.checkbox-label.highlight {
		background: #fef3c7;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.inline-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.inline-group .flex-input {
		flex: 1;
		min-width: 150px;
	}

	.inline-group input.small {
		width: 60px;
	}

	.form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.footer-left,
	.footer-right {
		display: flex;
		gap: 0.75rem;
	}

	.btn-primary,
	.btn-secondary,
	.btn-submit {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: white;
		color: #334155;
		border: 1px solid #e2e8f0;
	}

	.btn-secondary:hover {
		background: #f8fafc;
	}

	.btn-submit {
		background: #16a34a;
		color: white;
	}

	.btn-submit:hover:not(:disabled) {
		background: #15803d;
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
