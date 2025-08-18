'use client'
import React from 'react';

const Wizard = ({
    steps,
    currentStep,
    setCurrentStep,
    onFinish,
    stepOptions = [], // 🆕 Optional control per step
}) => {
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;

    const currentOptions = stepOptions[currentStep] || {};
    const { showNext = true, showPrev = true } = currentOptions;

    const next = () => {
        if (isLast) {
            onFinish?.();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const prev = () => {
        if (!isFirst) setCurrentStep(currentStep - 1);
    };

    const goToStep = (index) => {
        if (index >= 0 && index < steps.length) {
            setCurrentStep(index);
        }
    };

    const StepComponent = steps[currentStep];

    return (
        <div className="wizard-container">
            <div className="wizard-step">
                <StepComponent
                    next={next}
                    prev={prev}
                    goToStep={goToStep}
                    currentStep={currentStep}
                />
            </div>
            <div className="wizard-controls">
                {showPrev && !isFirst && <button onClick={prev}>Back</button>}
                {showNext && (
                    <button onClick={next}>
                        {isLast ? 'Finish' : 'Next'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Wizard;