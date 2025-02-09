/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { last } from 'lodash';
import React, { useMemo } from 'react';
import { AGGREGATIONS, GROUPBY } from '../../../../../common/constants/explorer';
import {
  DEFAULT_CHART_STYLES,
  FILLOPACITY_DIV_FACTOR,
  PLOTLY_COLOR,
  VIS_CHART_TYPES,
  PLOT_MARGIN,
} from '../../../../../common/constants/shared';
import { IVisualizationContainerProps } from '../../../../../common/types/explorer';
import { hexToRgb } from '../../../../components/event_analytics/utils/utils';
import { AvailabilityUnitType } from '../../../event_analytics/explorer/visualizations/config_panel/config_panes/config_controls/config_availability';
import { ThresholdUnitType } from '../../../event_analytics/explorer/visualizations/config_panel/config_panes/config_controls/config_thresholds';
import { Plt } from '../../plotly/plot';
import { transformPreprocessedDataToTraces, preprocessJsonData } from '../shared/common';

export const Line = ({ visualizations, layout, config }: any) => {
  const {
    DefaultModeLine,
    Interpolation,
    LineWidth,
    FillOpacity,
    MarkerSize,
    LegendPosition,
    ShowLegend,
    DefaultModeScatter,
    LabelAngle,
  } = DEFAULT_CHART_STYLES;

  const {
    data: {
      explorer: {
        explorerData: { jsonData },
      },
      userConfigs: {
        dataConfig: {
          chartStyles = {},
          legend = {},
          span = {},
          colorTheme = [],
          thresholds = [],
          tooltipOptions = {},
          panelOptions = {},
          [GROUPBY]: dimensions = [],
          [AGGREGATIONS]: series = [],
          breakdowns = [],
        } = {},
        layoutConfig = {},
        availabilityConfig = {},
      } = {},
    },
    vis: { icontype, name },
  }: IVisualizationContainerProps = visualizations;

  const tooltipMode =
    tooltipOptions.tooltipMode !== undefined ? tooltipOptions.tooltipMode : 'show';
  const tooltipText = tooltipOptions.tooltipText !== undefined ? tooltipOptions.tooltipText : 'all';
  const visType: string = name;
  const mode =
    chartStyles.style || (visType === VIS_CHART_TYPES.Line ? DefaultModeLine : DefaultModeScatter);
  const lineShape = chartStyles.interpolation || Interpolation;
  const lineWidth = chartStyles.lineWidth || LineWidth;
  const showLegend = !(legend.showLegend && legend.showLegend !== ShowLegend);
  const legendPosition = legend.position || LegendPosition;
  const markerSize = chartStyles.pointSize || MarkerSize;
  const fillOpacity =
    chartStyles.fillOpacity !== undefined
      ? chartStyles.fillOpacity / FILLOPACITY_DIV_FACTOR
      : FillOpacity / FILLOPACITY_DIV_FACTOR;
  const tickAngle = chartStyles.rotateLabels || LabelAngle;
  const labelSize = chartStyles.labelSize;
  const legendSize = legend.legendSize;
  const getSelectedColorTheme = (field: any, index: number) =>
    (colorTheme.length > 0 &&
      colorTheme.find((colorSelected) => colorSelected.name.name === field)?.color) ||
    PLOTLY_COLOR[index % PLOTLY_COLOR.length];

  const addStylesToTraces = (traces, traceStyles) => {
    const {
      fillOpacity: opac,
      tooltipMode: tltpMode,
      tooltipText: tltpText,
      lineWidth: lwidth,
      lineShape: lshape,
      markerSize: mkrSize,
    } = traceStyles;
    return traces.map((trace, idx: number) => {
      const selectedColor = getSelectedColorTheme(trace.aggName, idx);
      const fillColor = hexToRgb(selectedColor, opac);

      return {
        ...trace,
        hoverinfo: tltpMode === 'hidden' ? 'none' : tltpText,
        type: 'line',
        mode,
        ...{
          fill: 'tozeroy',
          fillcolor: fillColor,
        },
        line: {
          shape: lshape,
          width: lwidth,
          color: selectedColor,
        },
        marker: {
          size: mkrSize,
          ...{
            color: fillColor,
            line: {
              color: selectedColor,
              width: lwidth,
            },
          },
        },
      };
    });
  };

  let lines = useMemo(() => {
    const visConfig = {
      dimensions,
      series,
      breakdowns,
      span,
    };
    const traceStyles = {
      fillOpacity,
      tooltipMode,
      tooltipText,
      lineShape,
      lineWidth,
      markerSize,
    };
    const lineSpecficMetaData = {
      x_coordinate: 'x',
      y_coordinate: 'y',
    };

    return addStylesToTraces(
      transformPreprocessedDataToTraces(
        preprocessJsonData(jsonData, visConfig),
        visConfig,
        lineSpecficMetaData
      ),
      traceStyles
    );
  }, [chartStyles, jsonData, dimensions, series, span, breakdowns, panelOptions, tooltipOptions]);

  const mergedLayout = useMemo(() => {
    const axisLabelsStyle = {
      automargin: true,
      tickfont: {
        ...(labelSize && {
          size: labelSize,
        }),
      },
    };

    return {
      ...layout,
      title: panelOptions.title || layoutConfig.layout?.title || '',
      legend: {
        ...layout.legend,
        orientation: legendPosition,
        ...(legendSize && {
          font: {
            size: legendSize,
          },
        }),
      },
      autosize: true,
      xaxis: {
        tickangle: tickAngle,
        ...axisLabelsStyle,
      },
      yaxis: {
        ...axisLabelsStyle,
      },
      showlegend: showLegend,
      margin: PLOT_MARGIN,
    };
  }, [visualizations]);

  if (thresholds || availabilityConfig.level) {
    const thresholdTraces = {
      x: [],
      y: [],
      mode: 'text',
      text: [],
      showlegend: false,
    };

    const levels = availabilityConfig.level ? availabilityConfig.level : [];

    const mapToLine = (list: ThresholdUnitType[] | AvailabilityUnitType[], lineStyle: any) => {
      return list.map((thr: ThresholdUnitType) => {
        thresholdTraces.x.push(lines[0]?.x[0] || '');
        thresholdTraces.y.push(thr.value * (1 + 0.06));
        thresholdTraces.text.push(thr.name);
        return {
          type: 'line',
          x0: lines[0]?.x[0] || 0,
          y0: thr.value,
          x1: last(last(lines)?.x) || 1,
          y1: thr.value,
          name: thr.name || '',
          opacity: 0.7,
          line: {
            color: thr.color,
            width: 3,
            ...lineStyle,
          },
        };
      });
    };

    mergedLayout.shapes = [
      ...mapToLine(
        thresholds.filter((i: ThresholdUnitType) => i.value !== ''),
        { dash: 'dashdot' }
      ),
      ...mapToLine(levels, {}),
    ];

    lines = [...lines, thresholdTraces];
  }

  const mergedConfigs = useMemo(
    () => ({
      ...config,
      ...(layoutConfig.config && layoutConfig.config),
    }),
    [config, layoutConfig.config]
  );

  return <Plt data={lines} layout={mergedLayout} config={mergedConfigs} />;
};
