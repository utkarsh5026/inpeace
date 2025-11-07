const STAGE_COUNT = 4;
const STAGE_TRANSITION_DURATION = 500;

type StageNumber = 0 | 1 | 2 | 3 | 4;

export class StageManager {
  private stage: StageNumber = 0;

  showStage(stageNumber: StageNumber): void {
    const previousStage = this.stage;
    this.stage = stageNumber;

    if (previousStage > 0) this.transition(previousStage, stageNumber);
    else this.showNextStage(stageNumber);
  }

  private transition(previousStage: StageNumber, nextStage: StageNumber): void {
    const prevStage = document.getElementById(`stage${previousStage}`);

    if (prevStage && !prevStage.classList.contains('hidden')) {
      prevStage.classList.add('stage-fade-out');

      setTimeout(() => {
        prevStage.classList.add('hidden');
        prevStage.classList.remove('stage-fade-out');
        this.showNextStage(nextStage);
      }, STAGE_TRANSITION_DURATION);
      return;
    }

    this.showNextStage(nextStage);
  }

  showNextStage(stageNumber: StageNumber): void {
    this.hideOtherStages(stageNumber);

    const currentStageElement = document.getElementById(`stage${stageNumber}`);
    if (currentStageElement) {
      currentStageElement.classList.remove('hidden');

      if (stageNumber === 3) {
        currentStageElement.classList.add('stage3-container');
      } else {
        currentStageElement.classList.add('stage-fade-in');
        setTimeout(() => {
          currentStageElement.classList.remove('stage-fade-in');
        }, STAGE_TRANSITION_DURATION);
      }
    }

    if (stageNumber === 3) {
      setTimeout(() => this.showStage(4), 4500);
    }
  }

  private hideOtherStages(exceptStage: StageNumber): void {
    for (let i = 1; i <= STAGE_COUNT; i++) {
      const stageElement = document.getElementById(`stage${i}`);

      if (i === exceptStage || !stageElement) continue;

      stageElement.classList.add('hidden');
      stageElement.classList.remove(
        'stage-fade-in',
        'stage-fade-out',
        'stage3-container'
      );
    }
  }

  get currentStage() {
    return this.stage;
  }
}
