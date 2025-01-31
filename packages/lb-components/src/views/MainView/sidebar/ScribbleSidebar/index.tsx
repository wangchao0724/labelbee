import React, { useState, useEffect } from 'react';

import { Slider } from 'antd';
import penActivate from '@/assets/attributeIcon/pen_a.svg';
import pen from '@/assets/attributeIcon/pen.svg';
import eraserActivate from '@/assets/attributeIcon/eraser_a.svg';
import eraser from '@/assets/attributeIcon/eraser.svg';
import { getClassName } from '@/utils/dom';
import { AppState } from '@/store';
import { EScribblePattern } from '@/data/enums/ToolType';
import { useSelector } from '@/store/ctx';
import { cKeyCode } from '@labelbee/lb-annotation';

interface IProps {
  // toolInstance?: GraphToolInstance;
  // stepInfo?: IStepInfo;
  onChange: (tool: number, values: number) => void;
}

const EKeyCode = cKeyCode.default;

const SLIDER_MIN_SIZE = 1;
const SLIDER_MAX_SIZE = 50;
const DEFAULT_SLIDER_SIZE = 20;

const ScribbleSidebar: React.FC<IProps> = (props) => {
  const { onChange } = props;
  // 查看时候默认值
  const toolInstance = useSelector((state: AppState) => state.annotation.toolInstance);
  const [sliderValue, setSliderValue] = useState(DEFAULT_SLIDER_SIZE);
  const [selectTool, setSelectTool] = useState(EScribblePattern.Scribble);

  const changeValue = () => {
    onChange(selectTool, sliderValue);
  };

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sliderValue]);

  const onKeyDown = (event: KeyboardEvent) => {
    const { keyCode } = event;
    switch (keyCode) {
      case EKeyCode.Q:
        onSelectPattern(EScribblePattern.Scribble);
        break;
      case EKeyCode.W:
        onSelectPattern(EScribblePattern.Erase);
        break;

      case EKeyCode.F:
        addSlider();
        break;

      case EKeyCode.G:
        cutSlider();
        break;
    }
  };


  const addSlider = () => {

    if (sliderValue === SLIDER_MAX_SIZE) {
      return;
    }
    setSliderValue(sliderValue+1);
    changeValue();
    toolInstance?.setPenSize(sliderValue+1);
  };

  const cutSlider = () => {

    if (sliderValue === SLIDER_MIN_SIZE) {
      return;
    }
    setSliderValue(sliderValue-1);
    changeValue();
    toolInstance?.setPenSize(sliderValue-1);
  };

  const onSelectPattern = (pattern: EScribblePattern) => {
    setSelectTool(pattern);
    toolInstance?.setPattern(pattern);
    changeValue();
  };

  return (
    <div className={getClassName('scribble')}>
      <div className={getClassName('scribble', 'select')}>
        <img
          src={selectTool === EScribblePattern.Scribble ? penActivate : pen}
          onClick={() => onSelectPattern(EScribblePattern.Scribble)}
        />
        <img
          src={selectTool === EScribblePattern.Erase ? eraserActivate : eraser}
          onClick={() => onSelectPattern(EScribblePattern.Erase)}
        />
      </div>
      <div className={getClassName('scribble', 'slider')}>
        <span className={getClassName('scribble', 'circle')} />
        <Slider
          onChange={(v: number) => {
            setSliderValue(v);
            changeValue();
            toolInstance?.setPenSize(v);
          }}
          min={SLIDER_MIN_SIZE}
          max={SLIDER_MAX_SIZE}
          style={{ width: '60%' }}
          value={sliderValue}
        />
        <span
          className={getClassName('scribble', 'circle')}
          style={{ width: '10px', height: '10px' }}
        />
      </div>
    </div>
  );
};

export default ScribbleSidebar;
