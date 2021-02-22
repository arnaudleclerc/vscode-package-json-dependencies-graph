import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import { drag, scaleOrdinal, schemeCategory10, select } from 'd3';
import { Logger } from './logger';
import { window } from 'vscode';

interface DependencyNode {
    id: string;
    group: number;
}

interface DependencyLink {
    source: string;
    target: string;
    value: number;
}

interface Dependency {
    version: string;
    dependencies: { [name: string]: Dependency }[];
}

interface DependencyRoot extends Dependency {
    name: string;
}

export class DependenciesParser {

    private static _nodes: DependencyNode[] = [];
    private static _links: DependencyLink[] = [];

    private static readonly _width: number = 300;
    private static readonly _height: number = 300;

    public static parse(dependencyRoot: DependencyRoot): void {
        this._nodes.push({ id: dependencyRoot.name, group: 1 });

        Logger.info('Flattening dependencies');
        this.flattenDependencies(dependencyRoot, dependencyRoot.name);

        Logger.info(JSON.stringify(this._nodes));
        Logger.info(JSON.stringify(this._links));

        Logger.info('Generating graph');
        this.generateGraph();

        Logger.info('Graph generated');
    }

    private static flattenDependencies(dependency: Dependency, source: string): void {
        for (const name in dependency.dependencies) {
            const nodeIndex = this._nodes.findIndex(value => value.id === name);
            if (nodeIndex === -1) {
                this._nodes.push({ group: 1, id: name });
            } else {
                this._nodes[nodeIndex].group++;
            }

            const linkIndex = this._links.findIndex(value => value.source === source && value.target === name);
            if (linkIndex === -1) {
                this._links.push({ source: source, target: name, value: 1 });
            } else {
                this._links[linkIndex].value++;
            }

            const nextLevelDependencies = dependency.dependencies[name];

            for (const nextLevelDependency in nextLevelDependencies) {
                Logger.info(`Flattening dependencies for ${name}`);
                this.flattenDependencies(nextLevelDependencies[nextLevelDependency], name);
            }
        }
    }

    private static generateGraph(): void {
        try {
            const simulation = forceSimulation(this._nodes as any[])
                .force('link', forceLink(this._links as any[]).id(d => (d as any).id))
                .force("charge", forceManyBody())
                .force("center", forceCenter(this._width / 2, this._height / 2));

            const svg = select('#dependencyGraphContainer')
                .append('svg')
                .attr("width", this._width)
                .attr('height', this._height);

            const link = svg.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(this._links)
                .join("line")
                .attr("stroke-width", d => Math.sqrt(d.value));

            const node = svg.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(this._nodes)
                .join("circle")
                .attr("r", 5);
            // .attr("fill", color)
            // .call(drag());

            node.append("title")
                .text(d => d.id);

            simulation.on("tick", () => {
                link
                    .attr("x1", d => (d.source as any).x)
                    .attr("y1", d => (d.source as any).y)
                    .attr("x2", d => (d.source as any).x)
                    .attr("y2", d => (d.source as any).y);

                node
                    .attr("cx", d => (d as any).x)
                    .attr("cy", d => (d as any).y);
            });
        } catch (error) {
            Logger.info(error);
        }
    }

}