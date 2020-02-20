import _ from 'lodash';
import './css/annolist.css';
import { AnnotationsSrv } from 'grafana/app/features/annotations/annotations_srv';
import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import defaultsDeep from 'lodash/defaultsDeep';
// import moment from 'moment';

//private annotationsSrv: AnnotationsSrv
class AnnoListCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';
  static scrollable = true;

  found: any[] = [];

  panelDefaults = {
    limit: 10,
    tags: [],
    onlyFromThisDashboard: false,
    matchAny: true,
    queryType: "tags",

    showTags: true,
    showUser: true,
    showTime: true,

    navigateBefore: '10m',
    navigateAfter: '10m',
    navigateToPanel: true,
  };

  /** @ngInject */
  constructor($scope: any, $injector: any, private annotationsSrv: AnnotationsSrv) {
    super($scope, $injector);
    defaultsDeep(this.panel, this.panelDefaults);

    // _.defaults(this.panel, AnnoListCtrl.panelDefaults);

    // $scope.moment = moment;

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
  }
  onDataError(err: any) {
    console.log('onDataError', err);
  }

  onInitEditMode() {
    console.log("plugin id is", this.pluginId);
    this.addEditorTab('Options', `public/plugins/${this.pluginId}/partials/editor.html`, 2);
  }

  onRefresh() {
    const promises: Array<Promise<any>> = [];

    promises.push(this.getAnnotationSearch());

    return Promise.all(promises).then(
      this.renderingCompleted.bind(this)
    );
  }

  getAnnotationSearch(): Promise<any> {
    // http://docs.grafana.org/http_api/annotations/
    // https://github.com/grafana/grafana/blob/master/public/app/core/services/backend_srv.ts
    // https://github.com/grafana/grafana/blob/master/public/app/features/annotations/annotations_srv.ts

    const timeRange = this.timeSrv.timeRange()
    const params: any = {
      tags: this.panel.tags,
      limit: this.panel.limit,
      type: this.panel.queryType, // Skip the Annotations that are really alerts.  (Use the alerts panel!)
      annotation: 'annotation',
      range: {
        from: timeRange.from,
        to: timeRange.to
      },
      rangeRaw: timeRange.raw,
      matchAny: this.panel.matchAny
    };

    console.log("datasource is", this.datasource);
    console.log("annotationsSrv is", this.annotationsSrv);
    if (this.datasource) {
      console.log("executing datasource.annotationQuery with params :", params);
      return this.datasource.annotationQuery(params).then(result => {
        console.log("found annotations :", result);
        this.found = result.annotations;
      });
    }
    // return this.backendSrv.get('/api/annotations', params).then(result => {
    //   this.found = result;
    // });
    console.log("executing annotationsSrv.getAnnotations with params :", {
      dashboard: this.dashboard,
      panel: this.panel,
      range: this.range,
    });
    return this.annotationsSrv.getAnnotations({
      dashboard: this.dashboard,
      panel: this.panel,
      range: this.range,
    });
  }
}

export {AnnoListCtrl, AnnoListCtrl as PanelCtrl};
