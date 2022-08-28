import { getClassName } from '@/utils/dom';
import React, { useContext, useEffect, useState } from 'react';
import { PointCloudContainer } from './PointCloudLayout';
import AnnotationView from '@/components/AnnotationView';
import { PointCloudContext } from './PointCloudContext';
import { AppState } from '@/store';
import { connect } from 'react-redux';
import { IFileItem } from '@/types/data';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface IProps {
  imgInfo: IFileItem;
}

const Toolbar = ({
  onNext,
  onPrev,
  imgLength,
  imgIndex,
}: {
  onNext: () => void;
  onPrev: () => void;
  imgLength: number;
  imgIndex: number;
}) => {
  return (
    <div>
      <LeftOutlined onClick={onPrev} />
      <span>
        {' '}
        {imgIndex + 1} / {imgLength}{' '}
      </span>

      <RightOutlined onClick={onNext} />
    </div>
  );
};

// TODO, It will be deleted when the exported type of lb-annotation is work.
interface IAnnotationDataTemporarily {
  type: string;
  annotation: any;
}

const PointCloud2DView = ({ imgInfo }: IProps) => {
  const [annotations2d, setAnnotations2d] = useState<IAnnotationDataTemporarily[]>([]);
  const { pointCloudBoxList, topViewInstance } = useContext(PointCloudContext);
  const [mappingIndex, setMappingIndex] = useState(0);

  const mappingData = imgInfo?.mappingImgList?.[mappingIndex];

  useEffect(() => {
    if (topViewInstance && mappingData) {
      const { pointCloudInstance } = topViewInstance;
      const defaultViewStyle = {
        fill: 'transparent',
        color: 'green',
      };
      const newAnnotations2d: IAnnotationDataTemporarily[] = pointCloudBoxList.reduce(
        (acc: IAnnotationDataTemporarily[], pointCloudBox) => {
          const viewDataPointList = pointCloudInstance.pointCloudLidar2image(
            pointCloudBox,
            mappingData.calib,
          );
          return [
            ...acc,
            ...viewDataPointList.map((v: any) => {
              return {
                type: v.type,
                annotation: {
                  pointList: v.pointList,
                  ...defaultViewStyle,
                },
              };
            }),
          ];
        },
        [],
      );
      setAnnotations2d(newAnnotations2d);
    }
  }, [pointCloudBoxList, mappingData]);

  const size = {
    width: 700,
    height: 400,
  };

  if (!imgInfo) {
    return <div />;
  }

  const { mappingImgList } = imgInfo;

  if (!mappingImgList) {
    return <div />;
  }

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-2d-container')}
      title='2D视图'
      toolbar={
        <Toolbar
          imgIndex={mappingIndex}
          imgLength={mappingImgList.length}
          onNext={() => {
            if (mappingIndex >= mappingImgList.length - 1) {
              return;
            }
            setMappingIndex((v) => v + 1);
          }}
          onPrev={() => {
            if (mappingIndex <= 0) {
              return;
            }
            setMappingIndex((v) => v - 1);
          }}
        />
      }
    >
      <div className={getClassName('point-cloud-2d-image')}>
        <AnnotationView src={mappingData?.url ?? ''} annotations={annotations2d} size={size} />
      </div>
    </PointCloudContainer>
  );
};

const mapStateToProps = (state: AppState) => {
  const { imgList, imgIndex } = state.annotation;

  return {
    imgInfo: imgList[imgIndex],
  };
};

export default connect(mapStateToProps)(PointCloud2DView);
