/*
 * @file LLM tool answer sort
 * @Author: lixinghua lixinghua@sensetime.com
 * @Date: 2023-04-10
 */
import React, { useReducer, useEffect, useState } from 'react';
import { prefix } from '@/constant';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { LeftOutlined } from '@ant-design/icons';
import { classnames } from '@/utils';
import { cloneDeep } from 'lodash';
import { IAnswerSort, IWaitAnswerSort } from '@/components/LLMToolView/types';
import { MathUtils } from '@labelbee/lb-annotation';

interface IProps {
  setSortList: (value: any) => void;
  sortList: IAnswerSort[][];
  waitSortList: IWaitAnswerSort[];
  checkMode?: boolean;
}
enum EDirection {
  Top = 'Top',
  Right = 'Right',
  Bottom = 'Bottom',
  Left = 'Left',
}

interface IPoint {
  x: number;
  y: number;
}

interface ITagPoints {
  tl: IPoint; // Top Left Point;
  tr: IPoint; // Top Right Point;
  br: IPoint; // Bottom Right Point;
  bl: IPoint; // Bottom Left Point;
}

const contentBoxCls = `${prefix}-LLMSidebar-contentBox`;

const Navigation = () => {
  const { t } = useTranslation();
  return (
    <div className={`${contentBoxCls}__navigation`}>
      <span>{t('Best')}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <LeftOutlined />
        <div style={{ height: 0, border: '1px solid #999999', width: '450px' }} />
      </div>
      <span>{t('Worst')}</span>
    </div>
  );
};

const AnswerSort = (props: IProps) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const { sortList, setSortList, waitSortList, checkMode } = props;

  const isDisableAll = checkMode;
  const [activateDirection, setActivateDirection] = useState<EDirection | undefined>(undefined);
  const [targetTagKey, setTargetTagKey] = useState<number | undefined>(undefined);
  const [answers, setAnswers] = useState<IWaitAnswerSort[]>([]);
  const { t } = useTranslation();
  useEffect(() => {
    setAnswers(waitSortList);
  }, [waitSortList]);

  useEffect(() => {
    formatSortList();
  }, [JSON.stringify(sortList)]);

  const singleAnswerItem = ({ item, operation, id }: any) => {
    const borderStyle = { [`border${activateDirection}`]: '2px solid #8C9AFF' };

    return (
      <div
        key={`${item?.id}`}
        color='#EBEBEB'
        id={id}
        className={classnames({
          [`${contentBoxCls}__answerTag`]: true,
        })}
        style={targetTagKey === item?.id && activateDirection ? borderStyle : undefined}
        draggable={isDisableAll ? '' : 'true'}
        {...operation}
      >
        {item?.title}
      </div>
    );
  };

  const middlePoint = (P1: IPoint, P2: IPoint) => {
    return { x: (P1.x + P2.x) / 2, y: (P1.y + P2.y) / 2 };
  };
  const compareDistance = (sourceTagCenterPoint: IPoint, tagVertexPoint: ITagPoints) => {
    // top
    const toTopDistance = MathUtils.getLineLength(
      sourceTagCenterPoint,
      middlePoint(tagVertexPoint.tl, tagVertexPoint.tr),
    );
    // right
    const toRightDistance = MathUtils.getLineLength(
      sourceTagCenterPoint,
      middlePoint(tagVertexPoint.tr, tagVertexPoint.tr),
    );
    // bottom
    const toBottompDistance = MathUtils.getLineLength(
      sourceTagCenterPoint,
      middlePoint(tagVertexPoint.bl, tagVertexPoint.br),
    );
    // left
    const toLeftDistance = MathUtils.getLineLength(
      sourceTagCenterPoint,
      middlePoint(tagVertexPoint.tl, tagVertexPoint.bl),
    );

    const minDistance = Math.min(toTopDistance, toRightDistance, toBottompDistance, toLeftDistance);

    switch (minDistance) {
      case toTopDistance:
        setActivateDirection(EDirection.Top);
        break;
      case toRightDistance:
        setActivateDirection(EDirection.Right);
        break;
      case toBottompDistance:
        setActivateDirection(EDirection.Bottom);
        break;
      case toLeftDistance:
        setActivateDirection(EDirection.Left);
        break;

      default:
        break;
    }
  };

  const formatSortList = () => {
    const sortBox = document.getElementById('sortBox');

    if (sortBox?.childNodes) {
      let newSortList: any[] = [];
      sortBox.childNodes.forEach((item: any, nodeIndex: number) => {
        let itemBox = item;
        if (item?.childNodes?.length > 1) {
          itemBox = item.childNodes[0];
        }

        const tagClientRectValues = itemBox.getBoundingClientRect() || {};
        const { bottom, top, left, right, width, height, x, y }: any = tagClientRectValues;
        const tagCenterPoint = { x: left + width / 2, y: top + height / 2 };
        const tagVertexPoint = {
          tl: { x, y },
          tr: { x: right, y: top },
          br: { x: right, y: bottom },
          bl: { x: left, y: bottom },
        };
        const newList = sortList[nodeIndex].reduce((list: IAnswerSort[], key: any) => {
          let tagColumn = key;
          if (key.length > 1) {
            tagColumn = key[0];
          }
          tagColumn = { ...tagColumn, tagCenterPoint, tagVertexPoint };
          return [...list, tagColumn];
        }, []);
        newSortList.push(newList);
      });

      setSortList(newSortList);
    }
  };

  const onDrag = (e: any) => {
    const centerX = e.pageX;
    const centerY = e.pageY;
    const sourceTagCenterPoint = { x: centerX, y: centerY };
    let filterValue = sortList;

    if (filterValue?.length > 0) {
      // 获取距离最近的单个tag
      let tagNearest = filterValue[0];
      for (let index = 0; index < filterValue.length; index++) {
        if (index > 0) {
          // 当前点的中心坐标
          const tagCenterPoint = filterValue[index][0]?.tagCenterPoint;
          // 距离最近的中心坐标
          const lastTagCenterPoint = tagNearest[0]?.tagCenterPoint;
          // 当前点和移动点的距离
          const centerPointDistance = MathUtils.getLineLength(sourceTagCenterPoint, tagCenterPoint);
          // 上一个最近点的距离
          const lastCenterPointDistance = MathUtils.getLineLength(
            sourceTagCenterPoint,
            lastTagCenterPoint,
          );
          if (centerPointDistance < lastCenterPointDistance) {
            tagNearest = sortList[index];
          }
        }
      }
      if (!sourceTagCenterPoint.x || !sourceTagCenterPoint.y) {
        return;
      }
      // 不以拖动的tag做参照
      if (getAttributeIndex(e.target.id) === tagNearest[0]?.id) {
        setTargetTagKey(undefined);
        return;
      }
      setTargetTagKey(tagNearest[0]?.id);
      compareDistance(sourceTagCenterPoint, tagNearest[0]?.tagVertexPoint);
    }
  };

  const onDragEnd = (e: any) => {
    const { target } = e;
    let key = -1;
    let oldIndex = -1;
    let tagIndex = -1;
    let newList: any = [];
    let formatList = cloneDeep(sortList);

    tagIndex = formatList.findIndex((i: IAnswerSort[]) => i[0].id === Number(targetTagKey));
    if (target?.parentNode?.parentNode.id === 'sortBox') {
      key = getAttributeIndex(target.parentNode.id); // 父级
      const curKey = getAttributeIndex(target.id); // 拖动tag
      newList = formatList[~~key].filter((i: IAnswerSort) => i.id === ~~curKey);
      const removeIndex = formatList[~~key].findIndex((i: IAnswerSort) => i.id === ~~curKey);
      formatList[~~key].splice(removeIndex, 1);
    }
    if (target?.parentNode.id === 'sortBox') {
      if (!targetTagKey) {
        return;
      }
      key = getAttributeIndex(target.id);
      oldIndex = formatList.findIndex((i: IAnswerSort[]) => i[0].id === key);
      newList = formatList.find((i: IAnswerSort[]) => i[0].id === key);
      formatList.splice(oldIndex, 1);
      tagIndex = formatList.findIndex((i: IAnswerSort[]) => i[0].id === ~~targetTagKey);
    }
    if (target.parentNode.id === 'waitBox') {
      key = getAttributeIndex(target.id);
      oldIndex = answers.findIndex((i: any) => i.id === key);
      newList = [answers[oldIndex]];
      answers.splice(oldIndex, 1);
    }
    switch (activateDirection) {
      case EDirection.Left:
        formatList.splice(tagIndex, 0, newList);
        break;
      case EDirection.Right:
        formatList.splice(tagIndex + 1, 0, newList);
        break;
      case EDirection.Top:
      case EDirection.Bottom:
        formatList[tagIndex].push(...newList);
        break;
      default:
        formatList.push(newList);
        break;
    }

    setSortList(formatList);
    setActivateDirection(undefined);
    forceUpdate();
  };

  const getAttributeIndex = (str: string) => {
    const index = str.indexOf('-');
    return Number(str.substring(index + 1, str.length));
  };

  return (
    <div style={{ padding: '0px 16px', marginBottom: '16px' }}>
      <div className={`${contentBoxCls}__title`}>
        <span>{t('RankingQualityOfAnswers')}</span>
        {answers.length > 0 && (
          <Tag color='#FFD9D9' style={{ color: '#F26549', marginLeft: 8 }}>
            {t('Unfinished')}
          </Tag>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '16px' }}>{t('ToBeSorted')}</span>
          <div id='waitBox' className={`${contentBoxCls}__answerBox`}>
            {answers.length > 0 &&
              answers.map((i: any) =>
                singleAnswerItem({
                  item: i,
                  id: `waitBoxItem-${i?.id}`,
                  operation: {
                    onDrag: onDrag,
                    onDragEnd: onDragEnd,
                  },
                }),
              )}
          </div>
        </div>
        <Navigation />
        <div id='sortBox' className={`${contentBoxCls}__answerBox`}>
          {sortList.map((i: any, index: number) => {
            if (i.length > 1) {
              return (
                <div key={`item-${index}`} id={`sortBox-${index}`}>
                  {i.map((item: any) =>
                    singleAnswerItem({
                      item,
                      id: `sortBoxItem-${item?.id}`,
                      operation: {
                        onDrag: onDrag,
                        onDragEnd: onDragEnd,
                      },
                    }),
                  )}
                </div>
              );
            }
            return singleAnswerItem({
              item: i[0],
              id: `sortBox-${i[0]?.id}`,
              operation: {
                onDrag: onDrag,
                onDragEnd: onDragEnd,
              },
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default AnswerSort;
