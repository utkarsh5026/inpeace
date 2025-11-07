const STAGE_COUNT = 4;
const STAGE_TRANSITION_DURATION = 500;

type StageNumber = 0 | 1 | 2 | 3 | 4;

export class StageManager {
  private stage: StageNumber = 0;

  /**
   * Displays the specified stage number, handling transitions from the previous stage.
   *
   * If transitioning from stage 0, shows the new stage immediately.
   * Otherwise, performs an animated transition from the previous stage.
   *
   * @param stageNumber - The stage number to display (0-4)
   */
  showStage(stageNumber: StageNumber): void {
    const previousStage = this.stage;
    this.stage = stageNumber;

    if (previousStage > 0) this.transition(previousStage, stageNumber);
    else this.showNextStage(stageNumber);
  }

  /**
   * Handles the animated transition from one stage to another.
   *
   * Applies a fade-out animation to the previous stage, then shows the next stage
   * after the animation completes. If the previous stage is already hidden,
   * skips the animation and shows the next stage immediately.
   *
   * @param previousStage - The stage number to transition from
   * @param nextStage - The stage number to transition to
   * @private
   */
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

  /**
   * Shows the specified stage with appropriate animations and styling.
   *
   * Stage-specific behaviors:
   * - Stage 3: Applies 'stage3-container' class and auto-advances to stage 4 after 4.5s
   * - Other stages: Apply fade-in animation
   *
   * @param stageNumber - The stage number to show
   * @private
   *
   * @remarks
   * This method assumes DOM elements exist with IDs matching the pattern `stage${stageNumber}`.
   */
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
