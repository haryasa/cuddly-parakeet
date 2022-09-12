import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import { HierarchyNode, select } from 'd3';
import { OrgChart } from 'd3-org-chart';

interface Datum {
  id: string;
  parentId?: string;
  name: string;
  title: string;
  imageUrl: string;
  totalDescendants?: number;
}

interface Tree {
  roots: Array<string>;
  items: Record<string, Array<string>>;
}

type TreeCount = Record<string, number>;

@Component({
  selector: 'app-basic',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss']
})
export class BasicComponent implements AfterViewInit {
  @ViewChild('chartContainer') chartContainer: ElementRef;

  chart: OrgChart<Datum>;
  isCompact: boolean = false;

  constructor() {
    this.chart = new OrgChart();
  }

  ngAfterViewInit(): void {
    const data = this.getData();
    const processedData = this.processData(data);
    this.initChart(processedData);
  }

  onZoomOutClick(): void {
    this.chart.zoomOut();
  }

  onZoomInClick(): void {
    this.chart.zoomIn();
  }

  onFitClick(): void {
    this.chart.fit();
  }

  onCompactToggle(): void {
    this.isCompact = !this.isCompact;
    this.chart.compact(this.isCompact).render().fit();
  }

  private initChart(data: any): void {
    const defaultLinkUpdate = this.chart.linkUpdate();
    this.chart
      .container(this.chartContainer.nativeElement)
      .data(data)
      .rootMargin(75)
      .nodeWidth((d) => 285)
      .nodeHeight((d) => 130)
      .compact(this.isCompact)
      .linkUpdate(function(d, i, arr): void {
        defaultLinkUpdate.bind(this)(d, i, arr);
        select(this).attr("stroke", (d: any) => d.data._upToTheRootHighlighted ? '#152785' : '#f3f6ff');
      })
      .nodeContent((d: HierarchyNode<any> & { width: number }, i, arr, state) => {
        const imageDim = 75;
        return `
          <div style="background-color:white; position:absolute; width:${d.width}px; height:${d.height}px; border-radius:6px; border: 1px #9b9dac;">
            <img src="${d.data.imageUrl}" style="position:absolute; margin-top:${d.height/2 - imageDim/2}px; margin-left:15px; border-radius:70px; width:${imageDim}px; height:${imageDim}px;" />
            <div style="color:#313035; font-weight:bold; font-size:21px; position:absolute; top:42px; left:${30 + imageDim}px;">${d.data.name}</div>
            <div style="color:#464648; font-size:16px; position:absolute; left:${30 + imageDim}px; top:72px;">${d.data.title}</div>
          </div>
        `;
      })
      .buttonContent(({ node, state }) => {
        return `<div style="border-radius:5px; padding:6px; font-size:18px; margin:auto auto; min-width:30px; height:30px; text-align:center; background-color:${node.children?'#edf3ff':'#0297f1'}; color:${node.children?'#4482a7':'#bdfeff'};">${node.data.totalDescendants}</div>`
      })
      .render();
  }

  private getData(): Array<Datum> {
    return [
      { id: '0', name: 'Ann Henry', title: 'Head of design', imageUrl: './assets/photos/3.jpg' },
      { id: '1', parentId: '0', name: 'Floyd Miles', title: 'Design team lead', imageUrl: './assets/photos/32.jpg' },
      { id: '2', parentId: '0', name: 'Randall Flores', title: 'Design team lead', imageUrl: './assets/photos/37.jpg' },
      { id: '3', parentId: '0', name: 'Albert Cooper', title: 'Motion team lead', imageUrl: './assets/photos/78.jpg' },
      { id: '4', parentId: '1', name: 'Shawn Bell', title: 'Brand designer', imageUrl: './assets/photos/49.jpg' },
      { id: '5', parentId: '1', name: 'Harold Black', title: 'Brand designer', imageUrl: './assets/photos/83.jpg' },
      { id: '6', parentId: '1', name: 'Jorge Jones', title: 'Brand designer', imageUrl: './assets/photos/64.jpg' },
      { id: '7', parentId: '2', name: 'Tyrone Cooper', title: 'Design OPS', imageUrl: './assets/photos/68.jpg' },
      { id: '8', parentId: '2', name: 'Calvin Howard', title: 'Product designer', imageUrl: './assets/photos/74.jpg' },
      { id: '9', parentId: '3', name: 'Oryza Sativa', title: 'Motion designer', imageUrl: './assets/photos/44.jpg' },
      { id: '10', parentId: '8', name: 'Tanya Lane', title: 'Product designer', imageUrl: './assets/photos/60.jpg' },
      { id: '11', parentId: '8', name: 'Claire Fisher', title: 'Product designer', imageUrl: './assets/photos/90.jpg' }
    ];
  }

  private processData(data: Array<Datum>): Array<Datum> {
    const treeModel = this.convertToTreeModel(data);
    const treeCount = this.countChildren(treeModel);
    return data.map((item) => ({
      ...item,
      totalDescendants: treeCount[item.id] ?? 0
    }));
  }

  private convertToTreeModel(data: Array<Datum>): Tree {
    const items = {};
    const roots = [];

    data.forEach((item) => {
      if (item.parentId == null) {
        roots.push(item.id);
        return;
      }
      if (!items[item.parentId]) {
        items[item.parentId] = [];
      }
      items[item.parentId].push(item.id);
    });

    return { roots, items };
  }

  private countChildren(tree: Tree): TreeCount {
    const treeCount = {};
    tree.roots.forEach((root) => {
      treeCount[root] = this.traverseCount(root, tree, treeCount);
    });
    return treeCount;
  }

  private traverseCount(id: string, tree: Tree, treeCount: TreeCount): number {
    const children = tree.items[id];
    let count = 0;
    children?.forEach((child) => {
      treeCount[child] = this.traverseCount(child, tree, treeCount);
      count += treeCount[child] + 1;
    });
    return count;
  }
}
